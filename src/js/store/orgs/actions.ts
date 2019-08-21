import { Org } from '@/store/orgs/reducer';

interface OrgProvisioned {
  type: 'SCRATCH_ORG_PROVISIONED';
  payload: Org;
}
interface OrgProvisionFailed {
  type: 'SCRATCH_ORG_PROVISION_FAILED';
  payload: Org;
}

export type OrgsAction = OrgProvisioned | OrgProvisionFailed;

export const provisionOrg = (payload: Org): OrgProvisioned => ({
  type: 'SCRATCH_ORG_PROVISIONED',
  payload,
});

export const provisionFailed = (payload: Org): OrgProvisionFailed => ({
  type: 'SCRATCH_ORG_PROVISION_FAILED',
  payload,
});
