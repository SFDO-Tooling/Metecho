import { ObjectsAction } from '@/store/actions';
import { TaskAction } from '@/store/tasks/actions';
import { LogoutAction, RefetchDataAction } from '@/store/user/actions';
import { GitHubUser } from '@/store/user/reducer';
import {
  OBJECT_TYPES,
  ObjectTypes,
  ReviewStatuses,
  TaskStatuses,
} from '@/utils/constants';

export interface Commit {
  id: string;
  timestamp: string;
  message: string;
  author: {
    name: string;
    email: string;
    username: string;
    avatar_url: string;
  };
  url: string;
}

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
  pr_is_open: boolean;
  commits: Commit[];
  origin_sha: string | null;
  assigned_dev: GitHubUser | null;
  assigned_qa: GitHubUser | null;
  status: TaskStatuses;
  currently_submitting_review: boolean;
  review_submitted_at: string | null;
  review_valid: boolean;
  review_status: ReviewStatuses;
  review_sha: string | null;
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
      }: { object: Task; objectType?: ObjectTypes } = action.payload;
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
            const newTask = { ...object, currently_creating_pr: true };
            const existingTask = projectTasks.find((t) => t.id === object.id);
            if (existingTask) {
              return {
                ...tasks,
                [object.project]: projectTasks.map((t) => {
                  if (t.id === object.id) {
                    return newTask;
                  }
                  return t;
                }),
              };
            }
            return {
              ...tasks,
              [object.project]: [newTask, ...projectTasks],
            };
          }
          return tasks;
        }
      }
      return tasks;
    }
    case 'TASK_UPDATE':
    case 'UPDATE_OBJECT_SUCCEEDED': {
      let maybeTask;
      if (action.type === 'TASK_UPDATE') {
        maybeTask = action.payload;
      } else {
        const {
          object,
          objectType,
        }: { object: Task; objectType?: ObjectTypes } = action.payload;
        if (objectType === OBJECT_TYPES.TASK && object) {
          maybeTask = object;
        }
      }
      /* istanbul ignore if */
      if (!maybeTask) {
        return tasks;
      }
      const task = maybeTask;
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
