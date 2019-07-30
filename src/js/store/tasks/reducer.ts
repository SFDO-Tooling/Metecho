import { ObjectsAction } from '@/store/actions';
import { LogoutAction } from '@/store/user/actions';
import { OBJECT_TYPES, ObjectTypes } from '@/utils/constants';

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

const defaultState = {
  tasks: {},
};
const reducer = (
  tasks: TaskState = {},
  action: ObjectsAction | LogoutAction,
) => {
  switch (action.type) {
    case 'CREATE_OBJECT_SUCCEEDED': {
      const {
        data,
        objectType,
      }: { data: Task; objectType: ObjectTypes } = action.payload;
      if (objectType === OBJECT_TYPES.TASK) {
        return {
          [data.project]: [data],
        };
      }
    }
  }
  return tasks;
};

export default reducer;
