import { ObjectsAction } from '@/store/actions';
import { Org } from '@/store/orgs/reducer';
import { LogoutAction } from '@/store/user/actions';
import { OBJECT_TYPES, ObjectTypes } from '@/utils/constants';

export interface Task {
  id: string;
  name: string;
  slug: string;
  old_slugs: string[];
  project: string;
  description: string;
  dev_org: Org | null;
  qa_org: Org | null;
  branch_url?: string;
}

export interface TaskState {
  [key: string]: Task[];
}

const defaultState = {};

const reducer = (
  tasks: TaskState = defaultState,
  action: ObjectsAction | LogoutAction,
) => {
  switch (action.type) {
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
      if (objectType === OBJECT_TYPES.TASK && object) {
        const projectTasks = tasks[object.project] || [];
        // Do not store if (somehow) we already know about this task
        if (!projectTasks.filter(t => object.id === t.id).length) {
          return {
            ...tasks,
            // Prepend new task (tasks are ordered by `-created_at`)
            [object.project]: [object, ...projectTasks],
          };
        }
      }
      return tasks;
    }
  }
  return tasks;
};

export default reducer;
