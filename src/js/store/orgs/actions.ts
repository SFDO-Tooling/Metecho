import i18n from 'i18next';

import { ThunkResult } from '@/store';
import { Org } from '@/store/orgs/reducer';
import { addToast } from '@/store/toasts/actions';
import { OBJECT_TYPES, ORG_TYPES } from '@/utils/constants';

interface OrgProvisioned {
  type: 'SCRATCH_ORG_PROVISIONED';
  payload: Org;
}
interface OrgProvisionFailed {
  type: 'SCRATCH_ORG_PROVISION_FAILED';
  payload: Org;
}

export type OrgsAction = OrgProvisioned | OrgProvisionFailed;

export const provisionOrg = (payload: Org): ThunkResult => (
  dispatch,
  getState,
) => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.ORG,
      id: payload.id,
    });
  }
  const user = getState().user;
  if (user && user.id === payload.owner) {
    const msg = {
      [ORG_TYPES.DEV]: i18n.t('Successfully created new Dev org.'),
      [ORG_TYPES.QA]: i18n.t('Successfully created new QA org.'),
    };
    dispatch(
      addToast({
        heading: msg[payload.org_type],
        linkText: payload.url ? i18n.t('View your new org.') : undefined,
        linkUrl: payload.url || undefined,
        openLinkInNewWindow: true,
      }),
    );
  }
  return dispatch({
    type: 'SCRATCH_ORG_PROVISIONED',
    payload,
  });
};

export const provisionFailed = ({
  model,
  error,
}: {
  model: Org;
  error?: string;
}): ThunkResult => (dispatch, getState) => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.ORG,
      id: model.id,
    });
  }
  const user = getState().user;
  if (user && user.id === model.owner) {
    const msg = {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error creating your new Dev org.',
      ),
      [ORG_TYPES.QA]: i18n.t(
        'Uh oh. There was an error creating your new QA org.',
      ),
    };
    dispatch(
      addToast({
        heading: msg[model.org_type],
        details: error,
        variant: 'error',
      }),
    );
  }
  return dispatch({
    type: 'SCRATCH_ORG_PROVISION_FAILED',
    payload: model,
  });
};
