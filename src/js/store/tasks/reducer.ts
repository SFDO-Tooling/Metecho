import { ObjectsAction } from '@/store/actions';
import { LogoutAction } from '@/store/user/actions';
import { OBJECT_TYPES } from '@/utils/constants';

export interface Task {
  branch_url: string;
  description: string;
  id: string;
  name: string;
  old_slugs: string[];
  product: string;
  project: string;
  slug: string;
}

export interface TaskState {
  [key: string]: Task[];
}

const defaultState = {};
const reducer = (
  taskState: TaskState = defaultState,
  action: ObjectsAction | LogoutAction,
) => {
  switch (action.type) {
    case 'CREATE_OBJECT_SUCCEEDED': {
      const { data, objectType } = action.payload;
      if (objectType === OBJECT_TYPES.TASK) {
        const tasks = taskState[data.project] || [];
        return {
          ...taskState,
          [data.project]: tasks.concat(data as Task),
        };
      }
      return taskState;
    }
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const { filters, response, objectType } = action.payload;
      const { results } = response;
      if (objectType === OBJECT_TYPES.TASK) {
        return {
          ...taskState,
          [filters.project]: [...results],
        };
      }
      return taskState;
    }
  }
  return taskState;
};

export default reducer;
