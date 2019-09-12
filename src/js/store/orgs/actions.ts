import i18n from 'i18next';

import { ThunkResult } from '@/store';
import { Org } from '@/store/orgs/reducer';
import { selectTaskById } from '@/store/tasks/selectors';
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
interface RefetchOrg {
  type: 'REFETCH_ORG_STARTED' | 'REFETCH_ORG_SUCCEEDED' | 'REFETCH_ORG_FAILED';
  payload: { org: Org; url?: string; response?: Org | null };
}
interface OrgUpdated {
  type: 'SCRATCH_ORG_UPDATED';
  payload: Org;
}
interface OrgDeleted {
  type: 'SCRATCH_ORG_DELETED';
  payload: Org;
}
interface OrgDeleteFailed {
  type: 'SCRATCH_ORG_DELETE_FAILED';
  payload: Org;
}

export type OrgsAction =
  | OrgProvisioned
  | OrgProvisionFailed
  | RefetchOrg
  | OrgUpdated
  | OrgDeleted
  | OrgDeleteFailed;

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
  const state = getState();
  const user = state.user;
  if (user && user.id === payload.owner) {
    const task = selectTaskById(state, payload.task);
    let msg = {
      [ORG_TYPES.DEV]: i18n.t('Successfully created Dev org.'),
      [ORG_TYPES.QA]: i18n.t('Successfully created QA org.'),
    };
    if (task) {
      msg = {
        [ORG_TYPES.DEV]: `${i18n.t('Successfully created Dev org for task')} “${
          task.name
        }”.`,
        [ORG_TYPES.QA]: `${i18n.t('Successfully created QA org for task')} “${
          task.name
        }”.`,
      };
    }
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
  message,
}: {
  model: Org;
  message?: string;
}): ThunkResult => (dispatch, getState) => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.ORG,
      id: model.id,
    });
  }
  const state = getState();
  const user = state.user;
  if (user && user.id === model.owner) {
    const task = selectTaskById(state, model.task);
    let msg = {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error creating your new Dev org.',
      ),
      [ORG_TYPES.QA]: i18n.t(
        'Uh oh. There was an error creating your new QA org.',
      ),
    };
    if (task) {
      msg = {
        [ORG_TYPES.DEV]: `${i18n.t(
          'Uh oh. There was an error creating your new Dev org for task',
        )} “${task.name}”.`,
        [ORG_TYPES.QA]: `${i18n.t(
          'Uh oh. There was an error creating your new QA org for task',
        )} “${task.name}”.`,
      };
    }
    dispatch(
      addToast({
        heading: msg[model.org_type],
        details: message,
        variant: 'error',
      }),
    );
  }
  return dispatch({
    type: 'SCRATCH_ORG_PROVISION_FAILED',
    payload: model,
  });
};

export const refetchOrg = ({
  org,
}: {
  org: Org;
}): ThunkResult => async dispatch => {
  const url = window.api_urls.scratch_org_detail(org.id);
  dispatch({
    type: 'REFETCH_ORG_STARTED',
    payload: { org, url },
  });
  try {
    if (!url) {
      throw new Error(`No URL found for org: ${org.id}`);
    }
    const response = await apiFetch({
      url,
      dispatch,
    });
    if (!response) {
      return dispatch({
        type: 'REFETCH_ORG_FAILED',
        payload: { org, url, response },
      });
    }
    // @@@ Mock out until API exists
    setTimeout(() => {
      dispatch({
        type: 'SCRATCH_ORG_UPDATED',
        payload: { ...response },
      });
    }, 3000);
    return dispatch({
      type: 'REFETCH_ORG_SUCCEEDED',
      // @@@
      // eslint-disable-next-line @typescript-eslint/camelcase
      payload: { ...response, currently_refreshing_changes: true },
    });
  } catch (err) {
    dispatch({
      type: 'REFETCH_ORG_FAILED',
      payload: { org, url },
    });
    throw err;
  }
};

export const updateOrg = (payload: Org): OrgUpdated => ({
  type: 'SCRATCH_ORG_UPDATED',
  payload,
});

export const deleteOrg = (payload: Org): ThunkResult => (
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
  const state = getState();
  const user = state.user;
  if (user && user.id === payload.owner) {
    const task = selectTaskById(state, payload.task);
    let msg = {
      [ORG_TYPES.DEV]: i18n.t('Successfully deleted Dev org.'),
      [ORG_TYPES.QA]: i18n.t('Successfully deleted QA org.'),
    };
    /* istanbul ignore else */
    if (task) {
      msg = {
        [ORG_TYPES.DEV]: `${i18n.t('Successfully deleted Dev org for task')} “${
          task.name
        }”.`,
        [ORG_TYPES.QA]: `${i18n.t('Successfully deleted QA org for task')} “${
          task.name
        }”.`,
      };
    }
    dispatch(addToast({ heading: msg[payload.org_type] }));
  }
  return dispatch({
    type: 'SCRATCH_ORG_DELETED',
    payload,
  });
};

export const deleteFailed = ({
  model,
  message,
}: {
  model: Org;
  message?: string;
}): ThunkResult => (dispatch, getState) => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.ORG,
      id: model.id,
    });
  }
  const state = getState();
  const user = state.user;
  if (user && user.id === model.owner) {
    const task = selectTaskById(state, model.task);
    let msg = {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error deleting your Dev org.',
      ),
      [ORG_TYPES.QA]: i18n.t('Uh oh. There was an error deleting your QA org.'),
    };
    /* istanbul ignore else */
    if (task) {
      msg = {
        [ORG_TYPES.DEV]: `${i18n.t(
          'Uh oh. There was an error deleting your Dev org for task',
        )} “${task.name}”.`,
        [ORG_TYPES.QA]: `${i18n.t(
          'Uh oh. There was an error deleting your QA org for task',
        )} “${task.name}”.`,
      };
    }
    dispatch(
      addToast({
        heading: msg[model.org_type],
        details: message,
        variant: 'error',
      }),
    );
  }
  return dispatch({
    type: 'SCRATCH_ORG_DELETE_FAILED',
    payload: model,
  });
};
