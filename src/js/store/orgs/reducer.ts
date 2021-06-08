import { omit } from 'lodash';

import { ObjectsAction } from '~js/store/actions';
import { OrgsAction } from '~js/store/orgs/actions';
import { LogoutAction, RefetchDataAction } from '~js/store/user/actions';
import {
  OBJECT_TYPES,
  ObjectTypes,
  ORG_TYPES,
  OrgTypes,
} from '~js/utils/constants';

export interface MinimalOrg {
  id: string;
  task: string | null;
  epic: string | null;
  project: string | null;
  org_type: OrgTypes;
}

export interface Org extends MinimalOrg {
  owner: string;
  owner_gh_username: string;
  owner_gh_id: string | null;
  description: string;
  description_rendered: string;
  org_config_name: string;
  last_modified_at: string | null;
  expires_at: string | null;
  latest_commit: string;
  latest_commit_url: string;
  latest_commit_at: string | null;
  url: string;
  unsaved_changes: Changeset;
  has_unsaved_changes: boolean;
  total_unsaved_changes: number;
  ignored_changes: Changeset;
  has_ignored_changes: boolean;
  total_ignored_changes: number;
  currently_refreshing_changes: boolean;
  currently_capturing_changes: boolean;
  currently_refreshing_org: boolean;
  currently_reassigning_user: boolean;
  is_created: boolean;
  delete_queued_at: string | null;
  has_been_visited: boolean;
  valid_target_directories: TargetDirectories;
  last_checked_unsaved_changes_at: string | null;
}

export interface TargetDirectories {
  source?: string[];
  pre?: string[];
  post?: string[];
  config?: string[];
}

export interface Changeset {
  [key: string]: string[];
}

export interface OrgsByParent {
  [ORG_TYPES.DEV]: Org | null;
  [ORG_TYPES.QA]: Org | null;
  [ORG_TYPES.PLAYGROUND]: Org | null;
}

export interface OrgState {
  orgs: {
    [key: string]: Org;
  };
  fetched: {
    projects: string[];
    epics: string[];
    tasks: string[];
  };
}

export const defaultState = {
  orgs: {},
  fetched: {
    projects: [],
    epics: [],
    tasks: [],
  },
};

const reducer = (
  orgs: OrgState = defaultState,
  action: ObjectsAction | LogoutAction | OrgsAction | RefetchDataAction,
) => {
  switch (action.type) {
    case 'REFETCH_DATA_SUCCEEDED':
    case 'USER_LOGGED_OUT':
      return defaultState;
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const {
        response,
        objectType,
        filters: { task, epic, project },
      } = action.payload;
      if (objectType === OBJECT_TYPES.ORG && (task || epic || project)) {
        const fetched = { ...orgs.fetched };
        if (task && !fetched.tasks.includes(task)) {
          fetched.tasks = [...fetched.tasks, task];
        } else if (epic && !fetched.epics.includes(epic)) {
          fetched.epics = [...fetched.epics, epic];
        } else if (project && !fetched.projects.includes(project)) {
          fetched.projects = [...fetched.projects, project];
        }
        const allOrgs = { ...orgs.orgs };
        for (const org of response as Org[]) {
          allOrgs[org.id] = org;
        }
        return {
          ...orgs,
          orgs: allOrgs,
          fetched,
        };
      }
      return orgs;
    }
    case 'CREATE_OBJECT_SUCCEEDED': {
      switch (action.payload.objectType) {
        case OBJECT_TYPES.ORG: {
          const { object }: { object: Org } = action.payload;
          if (object) {
            return {
              ...orgs,
              orgs: { ...orgs.orgs, [object.id]: object },
            };
          }
          return orgs;
        }
        case OBJECT_TYPES.COMMIT: {
          const { object }: { object: Org } = action.payload;
          if (object) {
            return {
              ...orgs,
              orgs: {
                ...orgs.orgs,
                [object.id]: { ...object, currently_capturing_changes: true },
              },
            };
          }
          return orgs;
        }
      }
      return orgs;
    }
    case 'SCRATCH_ORG_PROVISIONING':
    case 'SCRATCH_ORG_PROVISION':
    case 'SCRATCH_ORG_UPDATE':
    case 'SCRATCH_ORG_DELETE_FAILED':
    case 'SCRATCH_ORG_COMMIT_CHANGES_FAILED':
    case 'SCRATCH_ORG_COMMIT_CHANGES':
    case 'SCRATCH_ORG_RECREATE':
    case 'SCRATCH_ORG_REASSIGN':
    case 'SCRATCH_ORG_REASSIGN_FAILED':
    case 'UPDATE_OBJECT_SUCCEEDED': {
      let maybeOrg;
      if (action.type === 'UPDATE_OBJECT_SUCCEEDED') {
        const {
          object,
          objectType,
        }: { object: Org; objectType?: ObjectTypes } = action.payload;
        if (objectType === OBJECT_TYPES.ORG && object) {
          maybeOrg = object;
        }
      } else {
        maybeOrg = action.payload as Org;
      }
      /* istanbul ignore if */
      if (!maybeOrg) {
        return orgs;
      }
      const org = maybeOrg;
      return {
        ...orgs,
        orgs: { ...orgs.orgs, [org.id]: org },
      };
    }
    case 'SCRATCH_ORG_PROVISION_FAILED':
    case 'SCRATCH_ORG_DELETE': {
      const org = action.payload;
      return {
        ...orgs,
        orgs: omit(orgs.orgs, org.id),
      };
    }
    case 'REFETCH_ORG_STARTED':
    case 'REFETCH_ORG_SUCCEEDED':
    case 'REFETCH_ORG_FAILED': {
      const { org } = action.payload;
      return {
        ...orgs,
        orgs: {
          ...orgs.orgs,
          [org.id]: {
            ...org,
            currently_refreshing_changes:
              action.type === 'REFETCH_ORG_SUCCEEDED'
                ? org.currently_refreshing_changes
                : action.type !== 'REFETCH_ORG_FAILED',
          },
        },
      };
    }
    case 'DELETE_OBJECT_SUCCEEDED': {
      const { objectType, object }: { objectType?: ObjectTypes; object: Org } =
        action.payload;
      if (objectType === OBJECT_TYPES.ORG && object) {
        return {
          ...orgs,
          orgs: {
            ...orgs.orgs,
            [object.id]: {
              ...object,
              delete_queued_at: new Date().toISOString(),
            },
          },
        };
      }
      return orgs;
    }
    case 'SCRATCH_ORG_REFRESH_REQUESTED':
    case 'SCRATCH_ORG_REFRESH_REJECTED': {
      const org = action.payload;
      const existingOrg = orgs.orgs[org.id] ?? {};
      return {
        ...orgs,
        orgs: {
          ...orgs.orgs,
          [org.id]: {
            ...existingOrg,
            ...org,
            currently_refreshing_org:
              action.type === 'SCRATCH_ORG_REFRESH_REQUESTED',
          },
        },
      };
    }
  }
  return orgs;
};

export default reducer;
