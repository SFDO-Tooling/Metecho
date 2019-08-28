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
interface RequestChangesetEvent {
  type: 'REQUEST_CHANGESET_STARTED' | 'REQUEST_CHANGESET_FAILED';
  payload: ChangesetPayload;
}
export interface RequestChangesetSucceeded {
  type: 'REQUEST_CHANGESET_SUCCEEDED';
  payload: {
    changeset: Changeset;
  } & ChangesetPayload;
}
interface ChangesetEvent {
  type: 'CHANGESET_SUCCEEDED' | 'CHANGESET_FAILED' | 'CHANGESET_CANCELED';
  payload: Changeset;
}

export type OrgsAction =
  | OrgProvisioned
  | OrgProvisionFailed
  | RequestChangesetEvent
  | RequestChangesetSucceeded
  | ChangesetEvent;

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
    type: 'REQUEST_CHANGESET_STARTED',
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
    // @@@ Mock out until API exists...
    setTimeout(() => {
      const mockChangeset = {
        id: 'changeset-id',
        task: org.task,
        changes: {
          ApexClasses: [
            { id: '0', name: 'Class 1' },
            { id: '1', name: 'Class 2' },
          ],
          CustomObjects: [{ id: '2', name: 'Custom objects' }],
          ClassOthers: [{ id: '3', name: 'Class others' }],
          FooBars: [{ id: '4', name: 'Foo Bars' }],
          Feefitfum: [{ id: '5', name: 'Fee fitfum' }],
          'Whatcha macallit': [{ id: '6', name: 'Whatchamacallit' }],
          'Loopy ': [{ id: '7', name: 'Loopy Looo' }],
        },
      };
      dispatch(
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        addChangeset(mockChangeset),
      );
    }, 1500);
    return dispatch({
      type: 'REQUEST_CHANGESET_SUCCEEDED',
      payload: { org, url, changeset },
    });
  } catch (err) {
    dispatch({
      type: 'REQUEST_CHANGESET_FAILED',
      payload: { org, url },
    });
    throw err;
  }
};

export const addChangeset = (payload: Changeset): ChangesetEvent => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.CHANGESET,
      id: payload.id,
    });
  }
  return {
    type: 'CHANGESET_SUCCEEDED',
    payload,
  };
};

export const changesetFailed = ({
  model,
  error,
}: {
  model: Changeset;
  error?: string;
}): ThunkResult => dispatch => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.CHANGESET,
      id: model.id,
    });
  }
  dispatch(
    addToast({
      heading: i18n.t(
        'Uh oh. There was an error capturing changes from your scratch org.',
      ),
      details: error,
      variant: 'error',
    }),
  );
  return dispatch({
    type: 'CHANGESET_FAILED',
    payload: model,
  });
};

export const cancelChangeset = (payload: Changeset): ChangesetEvent => ({
  type: 'CHANGESET_CANCELED',
  payload,
});
