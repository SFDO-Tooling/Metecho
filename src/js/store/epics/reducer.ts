import { ObjectsAction, PaginatedObjectResponse } from '~js/store/actions';
import { EpicAction } from '~js/store/epics/actions';
import { LogoutAction, RefetchDataAction } from '~js/store/user/actions';
import { EpicStatuses, OBJECT_TYPES, ObjectTypes } from '~js/utils/constants';

export interface Epic {
  id: string;
  project: string;
  name: string;
  slug: string;
  old_slugs: string[];
  description: string;
  description_rendered: string;
  branch_name: string;
  branch_url: string | null;
  branch_diff_url: string | null;
  pr_url: string | null;
  pr_is_open: boolean;
  pr_is_merged: boolean;
  has_unmerged_commits: boolean;
  currently_creating_branch: boolean;
  currently_creating_pr: boolean;
  github_users: string[];
  status: EpicStatuses;
  latest_sha: string;
}

export interface EpicsByProjectState {
  epics: Epic[];
  next: string | null;
  notFound: string[];
  fetched: boolean;
}

export interface EpicsState {
  [key: string]: EpicsByProjectState;
}

const defaultState = {
  epics: [],
  next: null,
  notFound: [],
  fetched: false,
};

const modelIsEpic = (model: any): model is Epic =>
  Boolean((model as Epic).project);

const reducer = (
  epics: EpicsState = {},
  action: EpicAction | ObjectsAction | LogoutAction | RefetchDataAction,
) => {
  switch (action.type) {
    case 'REFETCH_DATA_SUCCEEDED':
    case 'USER_LOGGED_OUT':
      return {};
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const {
        response,
        objectType,
        reset,
        filters: { project },
      } = action.payload;
      const { results, next } = response as PaginatedObjectResponse;
      if (objectType === OBJECT_TYPES.EPIC && project) {
        const projectEpics = epics[project] || { ...defaultState };
        if (reset) {
          return {
            ...epics,
            [project]: {
              ...projectEpics,
              epics: results,
              next,
              fetched: true,
            },
          };
        }
        // Store list of known epic IDs to filter out duplicates
        const ids = projectEpics.epics.map((p) => p.id);
        return {
          ...epics,
          [project]: {
            ...projectEpics,
            epics: [
              ...projectEpics.epics,
              ...results.filter((p) => !ids.includes(p.id)),
            ],
            next,
            fetched: true,
          },
        };
      }
      return epics;
    }
    case 'CREATE_OBJECT_SUCCEEDED': {
      const { object, objectType }: { object: Epic; objectType?: ObjectTypes } =
        action.payload;
      if (objectType === OBJECT_TYPES.EPIC && object) {
        const project = epics[object.project] || { ...defaultState };
        // Do not store if (somehow) we already know about this epic
        if (!project.epics.filter((p) => object.id === p.id).length) {
          return {
            ...epics,
            [object.project]: {
              ...project,
              // Prepend new epic (epics are ordered by `-created_at`)
              epics: [object, ...project.epics],
            },
          };
        }
      }
      return epics;
    }
    case 'FETCH_OBJECT_SUCCEEDED': {
      const {
        object,
        filters: { project, slug },
        objectType,
      } = action.payload;
      if (objectType === OBJECT_TYPES.EPIC && project) {
        const projectEpics = epics[project] || { ...defaultState };
        if (!object) {
          return {
            ...epics,
            [project]: {
              ...projectEpics,
              notFound: [...projectEpics.notFound, slug],
            },
          };
        }
        // Do not store if we already know about this epic
        if (!projectEpics.epics.filter((p) => object.id === p.id).length) {
          return {
            ...epics,
            [object.project]: {
              ...projectEpics,
              epics: [...projectEpics.epics, object],
            },
          };
        }
      }
      return epics;
    }
    case 'EPIC_UPDATE':
    case 'UPDATE_OBJECT_SUCCEEDED': {
      let maybeEpic;
      if (action.type === 'EPIC_UPDATE') {
        maybeEpic = action.payload;
      } else {
        const {
          object,
          objectType,
        }: { object: Epic; objectType?: ObjectTypes } = action.payload;
        if (objectType === OBJECT_TYPES.EPIC && object) {
          maybeEpic = object;
        }
      }
      /* istanbul ignore if */
      if (!maybeEpic) {
        return epics;
      }
      const epic = maybeEpic;
      const projectEpics = epics[epic.project] || {
        ...defaultState,
      };
      const existingEpic = projectEpics.epics.find((p) => p.id === epic.id);
      if (existingEpic) {
        return {
          ...epics,
          [epic.project]: {
            ...projectEpics,
            epics: projectEpics.epics.map((p) => {
              if (p.id === epic.id) {
                return { ...epic };
              }
              return p;
            }),
          },
        };
      }
      return {
        ...epics,
        [epic.project]: {
          ...projectEpics,
          epics: [...projectEpics.epics, epic],
        },
      };
    }
    case 'EPIC_CREATE_PR_FAILED': {
      const epic = action.payload;
      const projectEpics = epics[epic.project] || {
        ...defaultState,
      };
      const existingEpic = projectEpics.epics.find((p) => p.id === epic.id);
      if (existingEpic) {
        return {
          ...epics,
          [epic.project]: {
            ...projectEpics,
            epics: projectEpics.epics.map((p) => {
              if (p.id === epic.id) {
                return { ...epic, currently_creating_pr: false };
              }
              return p;
            }),
          },
        };
      }
      return epics;
    }
    case 'OBJECT_REMOVED':
    case 'DELETE_OBJECT_SUCCEEDED': {
      let maybeEpic;
      if (action.type === 'OBJECT_REMOVED') {
        maybeEpic = modelIsEpic(action.payload) ? action.payload : null;
      } else {
        const {
          object,
          objectType,
        }: { object: Epic; objectType?: ObjectTypes } = action.payload;
        if (objectType === OBJECT_TYPES.EPIC && object) {
          maybeEpic = object;
        }
      }
      /* istanbul ignore if */
      if (!maybeEpic) {
        return epics;
      }
      const epic = maybeEpic;
      /* istanbul ignore next */
      const projectEpics = epics[epic.project] || {
        ...defaultState,
      };
      return {
        ...epics,
        [epic.project]: {
          ...projectEpics,
          epics: projectEpics.epics.filter((p) => p.id !== epic.id),
        },
      };
    }
  }
  return epics;
};

export default reducer;
