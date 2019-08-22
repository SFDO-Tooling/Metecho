import { Org } from '@/store/orgs/reducer';
import { OBJECT_TYPES } from '@/utils/constants';

interface OrgProvisioned {
  type: 'SCRATCH_ORG_PROVISIONED';
  payload: Org;
}
interface OrgProvisionFailed {
  type: 'SCRATCH_ORG_PROVISION_FAILED';
  payload: Org;
}

export type OrgsAction = OrgProvisioned | OrgProvisionFailed;

export const provisionOrg = (payload: Org): OrgProvisioned => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.ORG,
      id: payload.id,
    });
  }
  return {
    type: 'SCRATCH_ORG_PROVISIONED',
    payload,
  };
};

export const provisionFailed = (payload: Org): OrgProvisionFailed => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.ORG,
      id: payload.id,
    });
  }
  return {
    type: 'SCRATCH_ORG_PROVISION_FAILED',
    payload,
  };
};
