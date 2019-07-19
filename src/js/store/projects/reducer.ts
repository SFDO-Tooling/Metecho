import { ObjectsAction } from '@/store/actions';
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
export interface ProjectsState {
  [key: string]: {
    projects: Project[];
    next: string | null;
    notFound: string[];
  };
}

const defaultState = {
  projects: [],
  next: null,
  notFound: [],
};

const reducer = (projects: ProjectsState = {}, action: ObjectsAction) => {
  switch (action.type) {
    case 'POST_OBJECT_SUCCEEDED': {
      const {
        response,
        objectType,
      }: { response: Project; objectType: ObjectTypes } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT) {
        const product = projects[response.product] || { ...defaultState };
        return {
          ...projects,
          [response.product]: {
            ...product,
            projects: [...product.projects, response],
          },
        };
      }
      return projects;
    }
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const {
        response: { results, next },
        objectType,
        reset,
      } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT) {
        if (reset) {
          /* do something here */
        }
        return {
          ...projects,
          projects: results,
          next,
        };
      }
      return projects;
    }
  }
  return projects;
};

export default reducer;
