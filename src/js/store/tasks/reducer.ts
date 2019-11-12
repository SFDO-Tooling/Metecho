/* eslint-disable @typescript-eslint/camelcase */

import { ObjectsAction } from '@/store/actions';
import { TaskAction } from '@/store/tasks/actions';
import { LogoutAction, RefetchDataAction } from '@/store/user/actions';
import { OBJECT_TYPES, ObjectTypes } from '@/utils/constants';

export interface Task {
  id: string;
  name: string;
  slug: string;
  old_slugs: string[];
  project: string;
  description: string;
  has_unmerged_commits: boolean;
  currently_creating_pr: boolean;
  branch_url: string | null;
  branch_diff_url: string | null;
  pr_url: string | null;
}

export interface TaskState {
  [key: string]: Task[];
}

const defaultState = {};

const reducer = (
  tasks: TaskState = defaultState,
  action: TaskAction | ObjectsAction | LogoutAction | RefetchDataAction,
) => {
  switch (action.type) {
    case 'REFETCH_DATA_SUCCEEDED':
    case 'USER_LOGGED_OUT':
      return defaultState;
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const {
        response,
        objectType,
        filters: { project },
      } = action.payload;
      if (objectType === OBJECT_TYPES.TASK && project) {
        return {
          ...tasks,
          [project]: response,
        };
      }
      return tasks;
    }
    case 'CREATE_OBJECT_SUCCEEDED': {
      const {
        object,
        objectType,
      }: { object: Task; objectType: ObjectTypes } = action.payload;
      switch (objectType) {
        case OBJECT_TYPES.TASK: {
          if (object) {
            const projectTasks = tasks[object.project] || [];
            // Do not store if (somehow) we already know about this task
            if (!projectTasks.filter((t) => object.id === t.id).length) {
              return {
                ...tasks,
                // Prepend new task (tasks are ordered by `-created_at`)
                [object.project]: [object, ...projectTasks],
              };
            }
          }
          return tasks;
        }
        case OBJECT_TYPES.TASK_PR: {
          if (object) {
            const projectTasks = tasks[object.project] || [];
            const existingTask = projectTasks.find((t) => t.id === object.id);
            if (existingTask) {
              return {
                ...tasks,
                [object.project]: projectTasks.map((t) => {
                  if (t.id === object.id) {
                    return { ...object, currently_creating_pr: true };
                  }
                  return t;
                }),
              };
            }
          }
          return tasks;
        }
      }
      return tasks;
    }
    case 'TASK_UPDATE': {
      const task = action.payload;
      const projectTasks = tasks[task.project] || [];
      const existingTask = projectTasks.find((t) => t.id === task.id);
      if (existingTask) {
        return {
          ...tasks,
          [task.project]: projectTasks.map((t) => {
            if (t.id === task.id) {
              return { ...task };
            }
            return t;
          }),
        };
      }
      return {
        ...tasks,
        [task.project]: [task, ...projectTasks],
      };
    }
    case 'TASK_CREATE_PR_FAILED': {
      const task = action.payload;
      const projectTasks = tasks[task.project] || [];
      const existingTask = projectTasks.find((t) => t.id === task.id);
      if (existingTask) {
        return {
          ...tasks,
          [task.project]: projectTasks.map((t) => {
            if (t.id === task.id) {
              return { ...task, currently_creating_pr: false };
            }
            return t;
          }),
        };
      }
      return tasks;
    }
  }
  return tasks;
};

export default reducer;
