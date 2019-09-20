/* eslint-disable @typescript-eslint/camelcase */

import { ObjectsAction } from '@/store/actions';
import { OrgsAction } from '@/store/orgs/actions';
import { LogoutAction } from '@/store/user/actions';
import {
  OBJECT_TYPES,
  ObjectTypes,
  ORG_TYPES,
  OrgTypes,
} from '@/utils/constants';

export interface Org {
  id: string;
  task: string;
  org_type: OrgTypes;
  owner: string;
  last_modified_at: string | null;
  expires_at: string | null;
  latest_commit: string;
  latest_commit_url: string;
  latest_commit_at: string | null;
  url: string | null;
  changes: Changeset | null;
  currently_refreshing_changes: boolean;
  delete_queued_at: string | null;
}

export interface Changeset {
  [key: string]: Change[];
}

interface Change {
  id: string;
  name: string;
}

export interface OrgsByTask {
  [ORG_TYPES.DEV]: Org | null;
  [ORG_TYPES.QA]: Org | null;
  committing?: boolean;
}

export interface OrgState {
  [key: string]: OrgsByTask;
}

export interface Commit {
  id: string;
  org: string;
  task: string;
}

const defaultState = {};

const reducer = (
  orgs: OrgState = defaultState,
  action: ObjectsAction | LogoutAction | OrgsAction,
) => {
  switch (action.type) {
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
              (response &&
                (response as Org[]).find(
                  org => org.org_type === ORG_TYPES.DEV,
                )) ||
              null,
            [ORG_TYPES.QA]:
              (response &&
                (response as Org[]).find(
                  org => org.org_type === ORG_TYPES.QA,
                )) ||
              null,
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
          const { object }: { object: Commit } = action.payload;
          if (object) {
            const taskOrgs = orgs[object.task] || {
              [ORG_TYPES.DEV]: null,
              [ORG_TYPES.QA]: null,
            };
            return {
              ...orgs,
              [object.task]: {
                ...taskOrgs,
                committing: true,
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
    case 'REFETCH_ORG_SUCCEEDED':
    case 'SCRATCH_ORG_DELETE_FAILED': {
      const org = action.payload as Org;
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
            currently_refreshing_changes: action.type === 'REFETCH_ORG_STARTED',
          },
        },
      };
    }
    case 'DELETE_OBJECT_SUCCEEDED': {
      const {
        objectType,
        object,
      }: { objectType: ObjectTypes; object: Org } = action.payload;
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
    case 'COMMIT_FAILED':
    case 'COMMIT_CREATE': {
      const commit = action.payload;
      const taskOrgs = orgs[commit.task] || {
        [ORG_TYPES.DEV]: null,
        [ORG_TYPES.QA]: null,
      };
      return {
        ...orgs,
        [commit.task]: {
          ...taskOrgs,
          committing: false,
        },
      };
    }
  }
  return orgs;
};

export default reducer;
