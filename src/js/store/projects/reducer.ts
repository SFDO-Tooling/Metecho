import { ObjectsAction } from '@/store/actions';
import { ProductsAction } from '@/store/products/actions';
import { LogoutAction } from '@/store/user/actions';
import { OBJECT_TYPES, ObjectTypes } from '@/utils/constants';

export interface Project {
  status?: string;
  name: string;
  description: string | null;
  pr_url: string;
  commit_message: string;
  release_notes: string;
  tasks: [];
}
export interface ProjectsState {
  projects: {
    id: {
      projects: [];
      next: string | null;
    };
  };
}

const defaultState = {
  projects: {
    id: {},
    next: null,
    notFound: [],
  },
};

const reducer = (
  projects: ProjectsState = defaultState,
  action: ObjectsAction,
) => {
  switch (action.type) {
    case 'POST_OBJECT_SUCCEEDED':
      const { content, objectType } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT) {
        return {
          [content.product]: {
            name: content.name,
            description: content.description,
          },
        };
      }
  }
  return projects;
};

export default reducer;
