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
  task: string;
  org_type: OrgTypes;
}

export interface Org extends MinimalOrg {
  owner: string;
  owner_gh_username: string;
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

export interface OrgsByTask {
  [ORG_TYPES.DEV]: Org | null;
  [ORG_TYPES.QA]: Org | null;
}

export interface OrgState {
  [key: string]: OrgsByTask;
}

const defaultState = {};

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
        filters: { task },
      } = action.payload;
      if (objectType === OBJECT_TYPES.ORG && task) {
        return {
          ...orgs,
          [task]: {
            [ORG_TYPES.DEV]:
              (response as Org[])?.find(
                (org) => org.org_type === ORG_TYPES.DEV,
              ) || null,
            [ORG_TYPES.QA]:
              (response as Org[])?.find(
                (org) => org.org_type === ORG_TYPES.QA,
              ) || null,
          },
        };
      }
      return orgs;
    }
    case 'CREATE_OBJECT_SUCCEEDED': {
      switch (action.payload.objectType) {
        case OBJECT_TYPES.ORG: {
          const { object }: { object: Org } = action.payload;
          if (object) {
            const taskOrgs = orgs[object.task] || {
              [ORG_TYPES.DEV]: null,
              [ORG_TYPES.QA]: null,
            };
            return {
              ...orgs,
              [object.task]: {
                ...taskOrgs,
                [object.org_type]: object,
              },
            };
          }
          return orgs;
        }
        case OBJECT_TYPES.COMMIT: {
          const { object }: { object: Org } = action.payload;
          if (object) {
            const taskOrgs = orgs[object.task] || {
              [ORG_TYPES.DEV]: null,
              [ORG_TYPES.QA]: null,
            };
            return {
              ...orgs,
              [object.task]: {
                ...taskOrgs,
                [object.org_type]: {
                  ...object,
                  currently_capturing_changes: true,
                },
              },
            };
          }
          return orgs;
        }
      }
      return orgs;
    }
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
      const taskOrgs = orgs[org.task] || {
        [ORG_TYPES.DEV]: null,
        [ORG_TYPES.QA]: null,
      };
      return {
        ...orgs,
        [org.task]: {
          ...taskOrgs,
          [org.org_type]: org,
        },
      };
    }
    case 'SCRATCH_ORG_PROVISION_FAILED':
    case 'SCRATCH_ORG_DELETE': {
      const org = action.payload;
      const taskOrgs = orgs[org.task] || {
        [ORG_TYPES.DEV]: null,
        [ORG_TYPES.QA]: null,
      };
      return {
        ...orgs,
        [org.task]: {
          ...taskOrgs,
          [org.org_type]: null,
        },
      };
    }
    case 'REFETCH_ORG_STARTED':
    case 'REFETCH_ORG_SUCCEEDED':
    case 'REFETCH_ORG_FAILED': {
      const { org } = action.payload;
      const taskOrgs = orgs[org.task] || {
        [ORG_TYPES.DEV]: null,
        [ORG_TYPES.QA]: null,
      };
      return {
        ...orgs,
        [org.task]: {
          ...taskOrgs,
          [org.org_type]: {
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
      const {
        objectType,
        object,
      }: { objectType?: ObjectTypes; object: Org } = action.payload;
      if (objectType === OBJECT_TYPES.ORG && object) {
        const taskOrgs = orgs[object.task] || {
          [ORG_TYPES.DEV]: null,
          [ORG_TYPES.QA]: null,
        };
        return {
          ...orgs,
          [object.task]: {
            ...taskOrgs,
            [object.org_type]: {
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
      const taskOrgs = orgs[org.task] || {
        [ORG_TYPES.DEV]: null,
        [ORG_TYPES.QA]: null,
      };
      const existingOrg = taskOrgs[org.org_type];
      return {
        ...orgs,
        [org.task]: {
          ...taskOrgs,
          [org.org_type]: {
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
