import i18n from 'i18next';

import { ThunkResult } from '@/store';
import { Changeset, Commit, Org } from '@/store/orgs/reducer';
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
interface OrgDeleted {
  type: 'SCRATCH_ORG_DELETED';
  payload: Org;
}
interface OrgDeleteFailed {
  type: 'SCRATCH_ORG_DELETE_FAILED';
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
interface CommitEvent {
  type: 'COMMIT_SUCCEEDED' | 'COMMIT_FAILED';
  payload: Commit;
}

export type OrgsAction =
  | OrgProvisioned
  | OrgProvisionFailed
  | OrgDeleted
  | OrgDeleteFailed
  | RequestChangesetEvent
  | RequestChangesetSucceeded
  | ChangesetEvent
  | CommitEvent;

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
      // Success case
      dispatch(
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        addChangeset(mockChangeset),
      );
      // Error case
      // dispatch(
      //   // eslint-disable-next-line @typescript-eslint/no-use-before-define
      //   changesetFailed({ model: mockChangeset, error: 'Oops.' }),
      // );
    }, 3000);
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
  message,
}: {
  model: Changeset;
  message?: string;
}): ThunkResult => (dispatch, getState) => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.CHANGESET,
      id: model.id,
    });
  }
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
    type: 'CHANGESET_FAILED',
    payload: model,
  });
};

export const cancelChangeset = (payload: Changeset): ChangesetEvent => ({
  type: 'CHANGESET_CANCELED',
  payload,
});

export const commitSucceeded = (payload: Commit): ThunkResult => (
  dispatch,
  getState,
) => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.COMMIT,
      id: payload.id,
    });
  }
  const task = selectTaskById(getState(), payload.task);
  dispatch(
    addToast({
      heading: task
        ? `${i18n.t(
            'Successfully committed changes from your scratch org on task',
          )} “${task.name}”.`
        : i18n.t('Successfully committed changes from your scratch org.'),
    }),
  );
  return dispatch({
    type: 'COMMIT_SUCCEEDED',
    payload,
  });
};

export const commitFailed = ({
  model,
  message,
}: {
  model: Commit;
  message?: string;
}): ThunkResult => (dispatch, getState) => {
  /* istanbul ignore else */
  if (window.socket) {
    window.socket.unsubscribe({
      model: OBJECT_TYPES.COMMIT,
      id: model.id,
    });
  }
  const task = selectTaskById(getState(), model.task);
  dispatch(
    addToast({
      heading: task
        ? `${i18n.t(
            'Uh oh. There was an error committing changes from your scratch org on task',
          )} “${task.name}”.`
        : i18n.t(
            'Uh oh. There was an error committing changes from your scratch org.',
          ),
      details: message,
      variant: 'error',
    }),
  );
  return dispatch({
    type: 'COMMIT_FAILED',
    payload: model,
  });
};
