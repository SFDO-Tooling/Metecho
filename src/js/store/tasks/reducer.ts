import { find, reject, unionBy, uniq } from 'lodash';

import { ObjectsAction, PaginatedObjectResponse } from '@/js/store/actions';
import { TaskAction } from '@/js/store/tasks/actions';
import { LogoutAction, RefetchDataAction } from '@/js/store/user/actions';
import {
  NULL_FILTER_VALUE,
  OBJECT_TYPES,
  ObjectTypes,
  ReviewStatuses,
  TASKS_BY_PROJECT_KEY,
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
  created_at: string;
  epic: {
    id: string;
    name: string;
    slug: string;
    github_users: string[];
  } | null;
  project: string | null;
  root_project: string;
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
  issue: string | null;
}

export interface TaskByProjectState {
  // list of all (fetched) tasks for this project
  tasks: Task[];
  // list of `epic.id` where first page of tasks have been fetched, or "all"
  // if first page of tasks for the entire project have been fetched
  fetched: string[];
  // list of any task slugs that have been fetched and do not exist (404)
  // - epic-less tasks are stored as raw slugs
  // - tasks with epics are stored as `epic.id`-`slug`
  notFound: string[];
  // URLs for next page of paginated results
  next: {
    // `key` is an `epic.id` or "all" (for all tasks for the entire project)
    [key: string]: string | null;
  };
  count: {
    // `key` is an `epic.id` or "all" (for all tasks for the entire project)
    [key: string]: number;
  };
}

export interface TaskState {
  // `key` is a `project.id`
  [key: string]: TaskByProjectState;
}

const defaultState: TaskState = {};

const defaultProjectTasks = {
  tasks: [],
  fetched: [],
  notFound: [],
  next: {},
  count: {},
};

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
        filters: { epic, project },
      } = action.payload;
      if (objectType === OBJECT_TYPES.TASK && project) {
        const { results, next, count } = response as PaginatedObjectResponse;
        const projectTasks = tasks[project] || /* istanbul ignore next */ {
          ...defaultProjectTasks,
        };
        const fetched = projectTasks.fetched;
        if (epic) {
          return {
            ...tasks,
            [project]: {
              ...projectTasks,
              tasks: unionBy(results as Task[], projectTasks.tasks, 'id'),
              fetched: uniq([...fetched, epic]),
              next: {
                ...projectTasks.next,
                [epic]: next,
              },
              count: {
                ...projectTasks.count,
                [epic]: count,
              },
            },
          };
        }
        return {
          ...tasks,
          [project]: {
            ...projectTasks,
            tasks: unionBy(results as Task[], projectTasks.tasks, 'id'),
            fetched: uniq([...fetched, TASKS_BY_PROJECT_KEY]),
            next: {
              ...projectTasks.next,
              all: next,
            },
            count: {
              ...projectTasks.count,
              all: count,
            },
          },
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
            const projectTasks = tasks[object.root_project] || {
              ...defaultProjectTasks,
            };
            const existingTask = find(projectTasks.tasks, ['id', object.id]);
            // Do not store if (somehow) we already know about this task
            if (!existingTask) {
              return {
                ...tasks,
                [object.root_project]: {
                  ...projectTasks,
                  // Prepend new task (tasks are ordered by `-created_at`)
                  tasks: [object, ...projectTasks.tasks],
                },
              };
            }
          }
          return tasks;
        }
        case OBJECT_TYPES.TASK_PR: {
          if (object) {
            const newTask = { ...object, currently_creating_pr: true };
            const projectTasks = tasks[object.root_project] || {
              ...defaultProjectTasks,
            };
            const existingTask = find(projectTasks.tasks, ['id', object.id]);
            if (existingTask) {
              return {
                ...tasks,
                [object.root_project]: {
                  ...projectTasks,
                  tasks: projectTasks.tasks.map((t) => {
                    if (t.id === object.id) {
                      return newTask;
                    }
                    return t;
                  }),
                },
              };
            }
            return {
              ...tasks,
              [object.root_project]: {
                ...projectTasks,
                tasks: [newTask, ...projectTasks.tasks],
              },
            };
          }
          return tasks;
        }
      }
      return tasks;
    }
    case 'FETCH_OBJECT_SUCCEEDED': {
      const {
        object,
        filters: { project, epic, slug },
        objectType,
      } = action.payload;
      if (objectType === OBJECT_TYPES.TASK && project) {
        const projectTasks = tasks[project] || { ...defaultProjectTasks };
        const hasEpic = Boolean(epic && epic !== NULL_FILTER_VALUE);
        if (!object) {
          return {
            ...tasks,
            [project]: {
              ...projectTasks,
              notFound: [
                ...projectTasks.notFound,
                hasEpic ? `${epic}-${slug}` : slug,
              ],
            },
          };
        }
        const existingTask = find(projectTasks.tasks, ['id', object.id]);
        if (existingTask) {
          return {
            ...tasks,
            [project]: {
              ...projectTasks,
              tasks: projectTasks.tasks.map((t) => {
                if (t.id === object.id) {
                  return { ...object };
                }
                return t;
              }),
            },
          };
        }
        return {
          ...tasks,
          [project]: {
            ...projectTasks,
            tasks: [object, ...projectTasks.tasks],
          },
        };
      }
      return tasks;
    }
    case 'TASK_CREATE':
    case 'TASK_UPDATE':
    case 'UPDATE_OBJECT_SUCCEEDED': {
      let maybeTask;
      if (action.type === 'UPDATE_OBJECT_SUCCEEDED') {
        const {
          object,
          objectType,
        }: { object: Task; objectType?: ObjectTypes } = action.payload;
        if (objectType === OBJECT_TYPES.TASK && object) {
          maybeTask = object;
        }
      } else {
        maybeTask = action.payload as Task;
      }
      /* istanbul ignore if */
      if (!maybeTask) {
        return tasks;
      }
      const task = maybeTask;
      const projectTasks = tasks[task.root_project] || {
        ...defaultProjectTasks,
      };
      const existingTask = find(projectTasks.tasks, ['id', task.id]);
      if (existingTask) {
        // Don't update existing task on TASK_CREATE event
        if (action.type === 'TASK_CREATE') {
          return tasks;
        }
        return {
          ...tasks,
          [task.root_project]: {
            ...projectTasks,
            tasks: projectTasks.tasks.map((t) => {
              if (t.id === task.id) {
                return { ...task };
              }
              return t;
            }),
          },
        };
      }
      return {
        ...tasks,
        [task.root_project]: {
          ...projectTasks,
          tasks: [task, ...projectTasks.tasks],
        },
      };
    }
    case 'TASK_CREATE_PR_FAILED': {
      const task = action.payload;
      const projectTasks = tasks[task.root_project] || {
        ...defaultProjectTasks,
      };
      const existingTask = find(projectTasks.tasks, ['id', task.id]);
      if (existingTask) {
        return {
          ...tasks,
          [task.root_project]: {
            ...projectTasks,
            tasks: projectTasks.tasks.map((t) => {
              if (t.id === task.id) {
                return { ...task, currently_creating_pr: false };
              }
              return t;
            }),
          },
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
      const projectTasks = tasks[task.root_project] || {
        ...defaultProjectTasks,
      };
      return {
        ...tasks,
        [task.root_project]: {
          ...projectTasks,
          tasks: reject(projectTasks.tasks, ['id', task.id]),
        },
      };
    }
  }
  return tasks;
};

export default reducer;
