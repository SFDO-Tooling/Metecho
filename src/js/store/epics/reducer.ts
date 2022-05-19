import { ObjectsAction, PaginatedObjectResponse } from '@/js/store/actions';
import { EpicAction } from '@/js/store/epics/actions';
import { LogoutAction, RefetchDataAction } from '@/js/store/user/actions';
import { EpicStatuses, OBJECT_TYPES, ObjectTypes } from '@/js/utils/constants';

export interface Epic {
  id: string;
  project: string;
  name: string;
  slug: string;
  old_slugs: string[];
  created_at: string;
  description: string;
  description_rendered: string;
  task_count: number;
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
  issue: string | null;
}

export interface EpicsByProjectState {
  // list of all (fetched) epics for this project
  epics: Epic[];
  // URL of next page, if there are more than one page
  next: string | null;
  // list of any epic slugs that have been fetched and do not exist (404)
  notFound: string[];
  // - whether the first page of epics for this project have been fetched
  fetched: boolean;
}

export interface EpicsState {
  // `key` is a `project.id`
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
        const ids = projectEpics.epics.map((e) => e.id);
        return {
          ...epics,
          [project]: {
            ...projectEpics,
            epics: [
              ...projectEpics.epics,
              ...results.filter((e) => !ids.includes(e.id)),
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
        if (!project.epics.filter((e) => object.id === e.id).length) {
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
        if (!projectEpics.epics.filter((e) => object.id === e.id).length) {
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
    case 'EPIC_CREATE':
    case 'EPIC_UPDATE':
    case 'UPDATE_OBJECT_SUCCEEDED': {
      let maybeEpic;
      if (action.type === 'UPDATE_OBJECT_SUCCEEDED') {
        const {
          object,
          objectType,
        }: { object: Epic; objectType?: ObjectTypes } = action.payload;
        if (objectType === OBJECT_TYPES.EPIC && object) {
          maybeEpic = object;
        }
      } else {
        maybeEpic = action.payload as Epic;
      }
      /* istanbul ignore if */
      if (!maybeEpic) {
        return epics;
      }
      const epic = maybeEpic;
      const projectEpics = epics[epic.project] || {
        ...defaultState,
      };
      const existingEpic = projectEpics.epics.find((e) => e.id === epic.id);
      if (existingEpic) {
        // Don't update existing epic on EPIC_CREATE event
        if (action.type === 'EPIC_CREATE') {
          return epics;
        }
        return {
          ...epics,
          [epic.project]: {
            ...projectEpics,
            epics: projectEpics.epics.map((e) => {
              if (e.id === epic.id) {
                return { ...epic };
              }
              return e;
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
      const existingEpic = projectEpics.epics.find((e) => e.id === epic.id);
      if (existingEpic) {
        return {
          ...epics,
          [epic.project]: {
            ...projectEpics,
            epics: projectEpics.epics.map((e) => {
              if (e.id === epic.id) {
                return { ...epic, currently_creating_pr: false };
              }
              return e;
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
          epics: projectEpics.epics.filter((e) => e.id !== epic.id),
        },
      };
    }
  }
  return epics;
};

export default reducer;
