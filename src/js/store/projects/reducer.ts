import { ObjectsAction } from '@/store/actions';
import { LogoutAction } from '@/store/user/actions';
import { OBJECT_TYPES, ObjectTypes } from '@/utils/constants';

export interface Project {
  id: string;
  product: string;
  name: string;
  slug: string;
  old_slugs: string[];
  description: string;
  branch_url: string;
  status: string | null;
}
export interface ProjectsByProductState {
  projects: Project[];
  next: string | null;
  notFound: string[];
  fetched: boolean;
}
export interface ProjectsState {
  [key: string]: ProjectsByProductState;
}

const defaultState = {
  projects: [],
  next: null,
  notFound: [],
  fetched: false,
};

const reducer = (
  projects: ProjectsState = {},
  action: ObjectsAction | LogoutAction,
) => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return {};
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const {
        response: { results, next },
        objectType,
        reset,
        filters: { product },
      } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT && product) {
        const productProjects = projects[product] || { ...defaultState };
        if (reset) {
          return {
            ...projects,
            [product]: {
              ...productProjects,
              projects: results,
              next,
              fetched: true,
            },
          };
        }
        // Store list of known project IDs to filter out duplicates
        const ids = productProjects.projects.map(p => p.id);
        return {
          ...projects,
          [product]: {
            ...productProjects,
            projects: [
              ...productProjects.projects,
              ...results.filter(p => !ids.includes(p.id)),
            ],
            next,
            fetched: true,
          },
        };
      }
      return projects;
    }
    case 'CREATE_OBJECT_SUCCEEDED': {
      const {
        object,
        objectType,
      }: { object: Project; objectType: ObjectTypes } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT && object) {
        const product = projects[object.product] || { ...defaultState };
        // Do not store if (somehow) we already know about this project
        if (!product.projects.filter(p => object.id === p.id).length) {
          return {
            ...projects,
            [object.product]: {
              ...product,
              projects: [...product.projects, object],
            },
          };
        }
      }
      return projects;
    }
  }
  return projects;
};

export default reducer;
