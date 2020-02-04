import i18n from 'i18next';

import { ThunkResult } from '@/store';
import { Org } from '@/store/orgs/reducer';
import { selectTaskById } from '@/store/tasks/selectors';
import { addToast } from '@/store/toasts/actions';
import apiFetch, { addUrlParams } from '@/utils/api';
import { OBJECT_TYPES, ORG_TYPES } from '@/utils/constants';

interface OrgProvisioned {
  type: 'SCRATCH_ORG_PROVISION';
  payload: Org;
}
interface OrgProvisionFailed {
  type: 'SCRATCH_ORG_PROVISION_FAILED';
  payload: Org;
}
interface RefetchOrg {
  type: 'REFETCH_ORG_STARTED' | 'REFETCH_ORG_SUCCEEDED' | 'REFETCH_ORG_FAILED';
  payload: { org: Org; url: string; response?: any };
}
interface OrgUpdated {
  type: 'SCRATCH_ORG_UPDATE';
  payload: Org;
}
interface OrgDeleted {
  type: 'SCRATCH_ORG_DELETE';
  payload: Org;
}
interface OrgDeleteFailed {
  type: 'SCRATCH_ORG_DELETE_FAILED';
  payload: Org;
}
interface CommitEvent {
  type: 'SCRATCH_ORG_COMMIT_CHANGES' | 'SCRATCH_ORG_COMMIT_CHANGES_FAILED';
  payload: Org;
}

export type OrgsAction =
  | OrgProvisioned
  | OrgProvisionFailed
  | RefetchOrg
  | OrgUpdated
  | OrgDeleted
  | OrgDeleteFailed
  | CommitEvent;

export const provisionOrg = (payload: Org): ThunkResult => (
  dispatch,
  getState,
) => {
  const state = getState();
  const user = state.user;
  /* istanbul ignore else */
  if (user && user.id === payload.owner) {
    const task = selectTaskById(state, payload.task);
    let msg = {
      [ORG_TYPES.DEV]: i18n.t('Successfully created Dev org.'),
      [ORG_TYPES.QA]: i18n.t('Successfully created Review org.'),
    };
    if (task) {
      msg = {
        [ORG_TYPES.DEV]: `${i18n.t('Successfully created Dev org for task')} “${
          task.name
        }”.`,
        [ORG_TYPES.QA]: `${i18n.t(
          'Successfully created Review org for task',
        )} “${task.name}”.`,
      };
    }
    dispatch(
      addToast({
        heading: msg[payload.org_type],
        linkText: payload.url ? i18n.t('View your new org.') : undefined,
        linkUrl: payload.url
          ? window.api_urls.scratch_org_redirect(payload.id)
          : undefined,
        openLinkInNewWindow: true,
      }),
    );
  }
  return dispatch({
    type: 'SCRATCH_ORG_PROVISION',
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
  const state = getState();
  const user = state.user;
  if (user && user.id === model.owner) {
    const task = selectTaskById(state, model.task);
    let msg = {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error creating your new Dev org.',
      ),
      [ORG_TYPES.QA]: i18n.t(
        'Uh oh. There was an error creating your new Review org.',
      ),
    };
    if (task) {
      msg = {
        [ORG_TYPES.DEV]: `${i18n.t(
          'Uh oh. There was an error creating your new Dev org for task',
        )} “${task.name}”.`,
        [ORG_TYPES.QA]: `${i18n.t(
          'Uh oh. There was an error creating your new Review org for task',
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

export const refetchOrg = (org: Org): ThunkResult => async (dispatch) => {
  const url = window.api_urls.scratch_org_detail(org.id);
  dispatch({
    type: 'REFETCH_ORG_STARTED',
    payload: { org, url },
  });
  try {
    /* istanbul ignore if */
    if (!url) {
      throw new Error(`No URL found for org: ${org.id}`);
    }
    const response = await apiFetch({
      // eslint-disable-next-line @typescript-eslint/camelcase
      url: addUrlParams(url, { get_unsaved_changes: true }),
      dispatch,
    });
    if (!response) {
      return dispatch({
        type: 'REFETCH_ORG_FAILED',
        payload: { org, url, response },
      });
    }
    return dispatch({
      type: 'REFETCH_ORG_SUCCEEDED',
      payload: { org: response, url },
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
  type: 'SCRATCH_ORG_UPDATE',
  payload,
});

export const updateFailed = ({
  model,
  message,
}: {
  model: Org;
  message?: string;
}): ThunkResult => (dispatch, getState) => {
  const task = selectTaskById(getState(), model.task);
  dispatch(
    addToast({
      heading: task
        ? `${i18n.t(
            'Uh oh. There was an error checking for changes on your scratch org for task',
          )} “${task.name}”.`
        : i18n.t(
            'Uh oh. There was an error checking for changes on your scratch org.',
          ),
      details: message,
      variant: 'error',
    }),
  );
  return dispatch({
    type: 'SCRATCH_ORG_UPDATE',
    payload: model,
  });
};

export const deleteOrg = ({
  org,
  message,
}: {
  org: Org;
  message?: string;
}): ThunkResult => (dispatch, getState) => {
  /* istanbul ignore else */
  if (window.socket) {
    // This unsubscription is important. In the case of an expired or deleted
    // org, the initial generic error event is often followed immediately by
    // another websocket error event specific to the action being attempted.
    // This could cause the org to be re-created in the store if the second
    // event is actually received. In practice this unsubscription should
    // prevent that, but another solution could be for the reducer to ignore
    // orgs that have already been removed.
    //
    // See https://github.com/oddbird/MetaShare/pull/79#discussion_r347644315
    window.socket.unsubscribe({
      model: OBJECT_TYPES.ORG,
      id: org.id,
    });
  }
  const state = getState();
  const user = state.user;
  if (user && user.id === org.owner) {
    if (message) {
      dispatch(
        addToast({
          heading: i18n.t(
            'Uh oh. There was an error communicating with your scratch org.',
          ),
          details: message,
          variant: 'error',
        }),
      );
    } else {
      const task = selectTaskById(state, org.task);
      let msg = {
        [ORG_TYPES.DEV]: i18n.t('Successfully deleted Dev org.'),
        [ORG_TYPES.QA]: i18n.t('Successfully deleted Review org.'),
      };
      /* istanbul ignore else */
      if (task) {
        msg = {
          [ORG_TYPES.DEV]: `${i18n.t(
            'Successfully deleted Dev org for task',
          )} “${task.name}”.`,
          [ORG_TYPES.QA]: `${i18n.t(
            'Successfully deleted Review org for task',
          )} “${task.name}”.`,
        };
      }
      dispatch(addToast({ heading: msg[org.org_type] }));
    }
  }
  return dispatch({
    type: 'SCRATCH_ORG_DELETE',
    payload: org,
  });
};

export const deleteFailed = ({
  model,
  message,
}: {
  model: Org;
  message?: string;
}): ThunkResult => (dispatch, getState) => {
  const state = getState();
  const user = state.user;
  /* istanbul ignore else */
  if (user && user.id === model.owner) {
    const task = selectTaskById(state, model.task);
    let msg = {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error deleting your Dev org.',
      ),
      [ORG_TYPES.QA]: i18n.t(
        'Uh oh. There was an error deleting your Review org.',
      ),
    };
    /* istanbul ignore else */
    if (task) {
      msg = {
        [ORG_TYPES.DEV]: `${i18n.t(
          'Uh oh. There was an error deleting your Dev org for task',
        )} “${task.name}”.`,
        [ORG_TYPES.QA]: `${i18n.t(
          'Uh oh. There was an error deleting your Review org for task',
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

export const commitSucceeded = (payload: Org): ThunkResult => (
  dispatch,
  getState,
) => {
  const task = selectTaskById(getState(), payload.task);
  dispatch(
    addToast({
      heading: task
        ? `${i18n.t(
            'Successfully captured changes from your scratch org on task',
          )} “${task.name}”.`
        : i18n.t('Successfully captured changes from your scratch org.'),
    }),
  );
  return dispatch({
    type: 'SCRATCH_ORG_COMMIT_CHANGES',
    payload,
  });
};

export const commitFailed = ({
  model,
  message,
}: {
  model: Org;
  message?: string;
}): ThunkResult => (dispatch, getState) => {
  const task = selectTaskById(getState(), model.task);
  dispatch(
    addToast({
      heading: task
        ? `${i18n.t(
            'Uh oh. There was an error capturing changes from your scratch org on task',
          )} “${task.name}”.`
        : i18n.t(
            'Uh oh. There was an error capturing changes from your scratch org.',
          ),
      details: message,
      variant: 'error',
    }),
  );
  return dispatch({
    type: 'SCRATCH_ORG_COMMIT_CHANGES_FAILED',
    payload: model,
  });
};
