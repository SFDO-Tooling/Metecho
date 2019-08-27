import i18n from 'i18next';

import { ThunkResult } from '@/store';
import { Changeset, Org } from '@/store/orgs/reducer';
import { addToast } from '@/store/toasts/actions';
import apiFetch from '@/utils/api';
import { OBJECT_TYPES, ORG_TYPES } from '@/utils/constants';

interface OrgProvisioned {
  type: 'SCRATCH_ORG_PROVISIONED';
  payload: Org;
}
interface OrgProvisionFailed {
  type: 'SCRATCH_ORG_PROVISION_FAILED';
  payload: Org;
}
interface ChangesetPayload {
  org: Org;
  url: string;
}
interface ChangesetEvent {
  type: 'FETCH_CHANGESET_STARTED' | 'FETCH_CHANGESET_FAILED';
  payload: ChangesetPayload;
}
interface ChangesetSucceeded {
  type: 'FETCH_CHANGESET_SUCCEEDED';
  payload: {
    changeset: Changeset;
  } & ChangesetPayload;
}

export type OrgsAction =
  | OrgProvisioned
  | OrgProvisionFailed
  | ChangesetEvent
  | ChangesetSucceeded;

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
      [ORG_TYPES.DEV]: i18n.t('Successfully created Dev org.'),
      [ORG_TYPES.QA]: i18n.t('Successfully created QA org.'),
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

export const getChangeset = ({
  org,
}: {
  org: Org;
}): ThunkResult => async dispatch => {
  const url = window.api_urls.scratch_org_detail(org.id);
  dispatch({
    type: 'FETCH_CHANGESET_STARTED',
    payload: { org, url },
  });
  try {
    const changeset = await apiFetch({
      url,
      dispatch,
    });
    if (changeset && changeset.id && window.socket) {
      window.socket.subscribe({
        model: OBJECT_TYPES.CHANGESET,
        id: changeset.id,
      });
    }
    return dispatch({
      type: 'FETCH_CHANGESET_SUCCEEDED',
      payload: { org, url, changeset },
    });
  } catch (err) {
    dispatch({
      type: 'FETCH_CHANGESET_FAILED',
      payload: { org, url },
    });
    throw err;
  }
};
