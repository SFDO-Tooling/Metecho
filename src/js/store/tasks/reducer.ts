import { ObjectsAction } from '@/js/store/actions';
import { TaskAction } from '@/js/store/tasks/actions';
import { LogoutAction, RefetchDataAction } from '@/js/store/user/actions';
import {
  OBJECT_TYPES,
  ObjectTypes,
  ReviewStatuses,
  TaskStatuses,
} from '@/js/utils/constants';

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
  epic: {
    id: string;
    name: string;
    slug: string;
    github_users: string[];
  };
  description: string;
  description_rendered: string;
  has_unmerged_commits: boolean;
  currently_creating_branch: boolean;
  currently_creating_pr: boolean;
  branch_name: string;
  branch_url: string | null;
  branch_diff_url: string | null;
  pr_url: string | null;
  pr_is_open: boolean;
  commits: Commit[];
  origin_sha: string;
  assigned_dev: string | null;
  assigned_qa: string | null;
  status: TaskStatuses;
  currently_submitting_review: boolean;
  review_submitted_at: string | null;
  review_valid: boolean;
  review_status: ReviewStatuses | '';
  review_sha: string;
  org_config_name: string;
}

export interface TaskState {
  [key: string]: Task[];
}

const defaultState = {};

const modelIsTask = (model: any): model is Task =>
  Boolean((model as Task).epic);

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
        filters: { epic },
      } = action.payload;
      if (objectType === OBJECT_TYPES.TASK && epic) {
        return {
          ...tasks,
          [epic]: response,
        };
      }
      return tasks;
    }
    case 'CREATE_OBJECT_SUCCEEDED': {
      const { object, objectType }: { object: Task; objectType?: ObjectTypes } =
        action.payload;
      switch (objectType) {
        case OBJECT_TYPES.TASK: {
          if (object) {
            const epicTasks = tasks[object.epic.id] || [];
            // Do not store if (somehow) we already know about this task
            if (!epicTasks.filter((t) => object.id === t.id).length) {
              return {
                ...tasks,
                // Prepend new task (tasks are ordered by `-created_at`)
                [object.epic.id]: [object, ...epicTasks],
              };
            }
          }
          return tasks;
        }
        case OBJECT_TYPES.TASK_PR: {
          if (object) {
            const epicTasks = tasks[object.epic.id] || [];
            const newTask = { ...object, currently_creating_pr: true };
            const existingTask = epicTasks.find((t) => t.id === object.id);
            if (existingTask) {
              return {
                ...tasks,
                [object.epic.id]: epicTasks.map((t) => {
                  if (t.id === object.id) {
                    return newTask;
                  }
                  return t;
                }),
              };
            }
            return {
              ...tasks,
              [object.epic.id]: [newTask, ...epicTasks],
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
      const epicTasks = tasks[task.epic.id] || [];
      const existingTask = epicTasks.find((t) => t.id === task.id);
      if (existingTask) {
        return {
          ...tasks,
          [task.epic.id]: epicTasks.map((t) => {
            if (t.id === task.id) {
              return { ...task };
            }
            return t;
          }),
        };
      }
      return {
        ...tasks,
        [task.epic.id]: [task, ...epicTasks],
      };
    }
    case 'TASK_CREATE_PR_FAILED': {
      const task = action.payload;
      const epicTasks = tasks[task.epic.id] || [];
      const existingTask = epicTasks.find((t) => t.id === task.id);
      if (existingTask) {
        return {
          ...tasks,
          [task.epic.id]: epicTasks.map((t) => {
            if (t.id === task.id) {
              return { ...task, currently_creating_pr: false };
            }
            return t;
          }),
        };
      }
      return tasks;
    }
    case 'OBJECT_REMOVED':
    case 'DELETE_OBJECT_SUCCEEDED': {
      let maybeTask;
      if (action.type === 'OBJECT_REMOVED') {
        maybeTask = modelIsTask(action.payload) ? action.payload : null;
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
      /* istanbul ignore next */
      const epicTasks = tasks[task.epic.id] || [];
      return {
        ...tasks,
        [task.epic.id]: epicTasks.filter((t) => t.id !== task.id),
      };
    }
  }
  return tasks;
};

export default reducer;
