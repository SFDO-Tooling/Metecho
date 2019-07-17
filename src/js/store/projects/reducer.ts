import { ObjectsAction } from '@/store/actions';
import { ProductsAction } from '@/store/products/actions';
import { LogoutAction } from '@/store/user/actions';
import { OBJECT_TYPES, ObjectTypes } from '@/utils/constants';

export interface Project {
  id: string;
  product: string;
  name: string;
  slug: string;
  old_slugs: string[];
  description: string;
  branch_name: string;
  branch_url: string;
}
export interface ProjectsState {
  [key: string]: {
    projects: [];
    next: string | null;
    notFound: string[];
  };
}

const reducer = (projects: ProjectsState = {}, action: ObjectsAction) => {
  switch (action.type) {
    case 'POST_OBJECT_SUCCEEDED':
      const { data, objectType } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT) {
        return {
          [data.product]: {
            name: data.name,
            description: data.description,
          },
        };
      }
  }
  return projects;
};

export default reducer;
