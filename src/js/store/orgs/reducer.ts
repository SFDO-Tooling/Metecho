import { ObjectsAction } from '@/store/actions';
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
  type: OrgTypes;
  owner: string;
  last_modified: string;
  expiration: string;
  latest_commit: string;
  latest_commit_url: string;
  url: string;
  has_changes: boolean;
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
  action: ObjectsAction | LogoutAction,
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
                (response as Org[]).find(org => org.type === ORG_TYPES.DEV)) ||
              null,
            [ORG_TYPES.QA]:
              (response &&
                (response as Org[]).find(org => org.type === ORG_TYPES.QA)) ||
              null,
          },
        };
      }
      return orgs;
    }
    case 'CREATE_OBJECT_SUCCEEDED': {
      const {
        object,
        objectType,
      }: { object: Org; objectType: ObjectTypes } = action.payload;
      if (objectType === OBJECT_TYPES.ORG && object) {
        const taskOrgs = orgs[object.task] || {
          [ORG_TYPES.DEV]: null,
          [ORG_TYPES.QA]: null,
        };
        return {
          ...orgs,
          [object.task]: {
            ...taskOrgs,
            [object.type]: object,
          },
        };
      }
      return orgs;
    }
  }
  return orgs;
};

export default reducer;
