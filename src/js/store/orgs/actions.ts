import { t } from 'i18next';

import { AppState, ThunkResult } from '@/js/store';
import { selectEpicById } from '@/js/store/epics/selectors';
import { isCurrentUser } from '@/js/store/helpers';
import { MinimalOrg, Org } from '@/js/store/orgs/reducer';
import { selectProjectById } from '@/js/store/projects/selectors';
import { selectTaskById } from '@/js/store/tasks/selectors';
import { addToast } from '@/js/store/toasts/actions';
import apiFetch, { addUrlParams } from '@/js/utils/api';
import { OBJECT_TYPES, ORG_TYPES } from '@/js/utils/constants';
import { OrgDatasetRefreshedEvent } from '@/js/utils/websockets';

interface OrgProvisioning {
  type: 'SCRATCH_ORG_PROVISIONING';
  payload: Org;
}
interface OrgProvisioned {
  type: 'SCRATCH_ORG_PROVISION';
  payload: Org;
}
interface OrgProvisionFailed {
  type: 'SCRATCH_ORG_PROVISION_FAILED';
  payload: Org | MinimalOrg;
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
  payload: Org | MinimalOrg;
}
interface OrgDeleteFailed {
  type: 'SCRATCH_ORG_DELETE_FAILED';
  payload: Org;
}
interface CommitEvent {
  type: 'SCRATCH_ORG_COMMIT' | 'SCRATCH_ORG_COMMIT_FAILED';
  payload: Org;
}
interface OrgRefresh {
  type: 'SCRATCH_ORG_REFRESH_REQUESTED' | 'SCRATCH_ORG_REFRESH_ACCEPTED';
  payload: Org;
}
interface OrgRefreshRejected {
  type: 'SCRATCH_ORG_REFRESH_REJECTED';
  payload: Org | MinimalOrg;
}
interface OrgRecreated {
  type: 'SCRATCH_ORG_RECREATE';
  payload: Org | MinimalOrg;
}
interface OrgReassigned {
  type: 'SCRATCH_ORG_REASSIGN';
  payload: Org | MinimalOrg;
}
interface OrgReassignFailed {
  type: 'SCRATCH_ORG_REASSIGN_FAILED';
  payload: Org | MinimalOrg;
}
interface RefreshDatasetsAction {
  type:
    | 'REFRESH_DATASETS_REQUESTED'
    | 'REFRESH_DATASETS_ACCEPTED'
    | 'REFRESH_DATASETS_REJECTED';
  payload: string;
}

export type OrgsAction =
  | OrgProvisioning
  | OrgProvisioned
  | OrgProvisionFailed
  | RefetchOrg
  | OrgUpdated
  | OrgDeleted
  | OrgDeleteFailed
  | CommitEvent
  | OrgRefresh
  | OrgRefreshRejected
  | OrgRecreated
  | OrgReassigned
  | OrgReassignFailed
  | RefreshDatasetsAction;

const getOrgParent = (
  org: Org | MinimalOrg,
  state: AppState,
): { name?: string; parent?: string; orgType: string } => {
  const task = selectTaskById(state, org.task);
  const epic = selectEpicById(state, org.epic);
  const project = selectProjectById(state, org.project);
  let typeTitle = t('Scratch Org');

  if (org.org_type === ORG_TYPES.QA) {
    typeTitle = t('Test Org');
  } else if (org.org_type === ORG_TYPES.DEV) {
    typeTitle = t('Dev Org');
  }

  if (task) {
    return { name: task.name, parent: t('Task'), orgType: typeTitle };
  } else if (epic) {
    return { name: epic.name, parent: t('Epic'), orgType: typeTitle };
  } else if (project) {
    return {
      name: project.name,
      parent: t('Project'),
      orgType: typeTitle,
    };
  }
  return { orgType: typeTitle };
};

export const provisionOrg =
  ({
    model,
    originating_user_id,
  }: {
    model: Org;
    originating_user_id: string | null;
  }): ThunkResult<OrgProvisioned> =>
  (dispatch, getState) => {
    const state = getState();
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      let msg = t('Successfully created {{orgType}}.', { orgType });

      /* istanbul ignore else */
      if (name && parent) {
        msg = t('Successfully created {{orgType}} for {{parent}} “{{name}}.”', {
          parent,
          name,
          orgType,
        });
      }
      dispatch(
        addToast({
          heading: msg,
          linkText: model.is_created ? t('View your new Org') : undefined,
          linkUrl: model.is_created
            ? window.api_urls.scratch_org_redirect(model.id)
            : undefined,
          openLinkInNewWindow: true,
        }),
      );
    }
    return dispatch({
      type: 'SCRATCH_ORG_PROVISION' as const,
      payload: model,
    });
  };

export const provisionFailed =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Org | MinimalOrg;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<OrgProvisionFailed> =>
  (dispatch, getState) => {
    const state = getState();
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      let msg = t('Uh oh. There was an error creating your new {{orgType}}.', {
        orgType,
      });

      /* istanbul ignore else */
      if (name && parent) {
        msg = t(
          'Uh oh. There was an error creating your new {{orgType}} for {{parent}} “{{name}}.”',
          { parent, name, orgType },
        );
      }

      const detailMsg = t(
        'The last line of the log is “{{message}}” If you need support, your scratch org id is {{orgId}}.',
        {
          message,
          orgId: model.id,
        },
      );

      dispatch(
        addToast({
          heading: msg,
          details: detailMsg,
          variant: 'error',
          linkUrl: window.api_urls.scratch_org_log(model.id),
          linkText: t('Download build log.'),
          linkDownload: true,
          linkDownloadFilename: t('Metecho Org {{orgId}} Build Log.txt', {
            message,
            orgId: model.id,
          }),
        }),
      );
    }
    return dispatch({
      type: 'SCRATCH_ORG_PROVISION_FAILED' as const,
      payload: model,
    });
  };

export const refetchOrg =
  (org: Org): ThunkResult<Promise<RefetchOrg>> =>
  async (dispatch) => {
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
        url: addUrlParams(url, { get_unsaved_changes: true }),
        dispatch,
      });
      if (!response) {
        return dispatch({
          type: 'REFETCH_ORG_FAILED' as const,
          payload: { org, url, response },
        });
      }
      return dispatch({
        type: 'REFETCH_ORG_SUCCEEDED' as const,
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

export const fetchFailed =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Org;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<OrgUpdated> =>
  (dispatch, getState) => {
    const state = getState();
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      let msg = t(
        'Uh oh. There was an error communicating with your {{orgType}}.',
        { orgType },
      );

      /* istanbul ignore else */
      if (name && parent) {
        msg = t(
          'Uh oh. There was an error communicating with your {{orgType}} for {{parent}} “{{name}}.”',
          { parent, name, orgType },
        );
      }
      dispatch(
        addToast({
          heading: msg,
          details: message,
          variant: 'error',
        }),
      );
    }
    return dispatch(updateOrg(model));
  };

export const deleteOrg =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Org | MinimalOrg;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<OrgDeleted> =>
  (dispatch, getState) => {
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
      // See https://github.com/oddbird/Metecho/pull/79#discussion_r347644315
      window.socket.unsubscribe({
        model: OBJECT_TYPES.ORG,
        id: model.id,
      });
    }
    const state = getState();
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      if (message) {
        dispatch(
          addToast({
            heading: t(
              'Uh oh. There was an error communicating with your {{orgType}}.',
              { orgType },
            ),
            details: message,
            variant: 'error',
          }),
        );
      } else {
        let msg = t('Successfully deleted {{orgType}}.', { orgType });

        /* istanbul ignore else */
        if (name && parent) {
          msg = t(
            'Successfully deleted {{orgType}} for {{parent}} “{{name}}.”',
            { parent, name, orgType },
          );
        }
        dispatch(addToast({ heading: msg }));
      }
    }
    return dispatch({
      type: 'SCRATCH_ORG_DELETE' as const,
      payload: model,
    });
  };

export const deleteFailed =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Org;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<OrgDeleteFailed> =>
  (dispatch, getState) => {
    const state = getState();
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      let msg = t('Uh oh. There was an error deleting your {{orgType}}.', {
        orgType,
      });

      /* istanbul ignore else */
      if (name && parent) {
        msg = t(
          'Uh oh. There was an error deleting your {{orgType}} for {{parent}} “{{name}}.”',
          { parent, name, orgType },
        );
      }
      dispatch(
        addToast({
          heading: msg,
          details: message,
          variant: 'error',
        }),
      );
    }
    return dispatch({
      type: 'SCRATCH_ORG_DELETE_FAILED' as const,
      payload: model,
    });
  };

export const commitSucceeded =
  (
    {
      model,
      originating_user_id,
    }: {
      model: Org;
      originating_user_id: string | null;
    },
    { is_metadata }: { is_metadata: boolean },
  ): ThunkResult<CommitEvent> =>
  (dispatch, getState) => {
    const state = getState();
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      const dataType = is_metadata ? t('changes') : t('data');
      let msg = t(
        'Successfully retrieved {{dataType}} from your {{orgType}}.',
        {
          orgType,
          dataType,
        },
      );

      /* istanbul ignore else */
      if (name && parent) {
        msg = t(
          'Successfully retrieved {{dataType}} from your {{orgType}} for {{parent}} “{{name}}.”',
          { parent, name, orgType, dataType },
        );
      }
      dispatch(
        addToast({
          heading: msg,
        }),
      );
    }
    return dispatch({
      type: 'SCRATCH_ORG_COMMIT' as const,
      payload: model,
    });
  };

export const commitFailed =
  (
    {
      model,
      message,
      originating_user_id,
    }: {
      model: Org;
      message?: string;
      originating_user_id: string | null;
    },
    { is_metadata }: { is_metadata: boolean },
  ): ThunkResult<CommitEvent> =>
  (dispatch, getState) => {
    const state = getState();
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      const dataType = is_metadata ? t('changes') : t('data');
      let msg = t(
        'Uh oh. There was an error retrieving {{dataType}} from your {{orgType}}.',
        { orgType, dataType },
      );

      /* istanbul ignore else */
      if (name && parent) {
        msg = t(
          'Uh oh. There was an error retrieving {{dataType}} from your {{orgType}} for {{parent}} “{{name}}.”',
          { parent, name, orgType, dataType },
        );
      }
      dispatch(
        addToast({
          heading: msg,
          details: message,
          variant: 'error',
        }),
      );
    }
    return dispatch({
      type: 'SCRATCH_ORG_COMMIT_FAILED' as const,
      payload: model,
    });
  };

export const refreshOrg =
  (org: Org): ThunkResult<Promise<OrgRefresh>> =>
  async (dispatch) => {
    dispatch({ type: 'SCRATCH_ORG_REFRESH_REQUESTED', payload: org });
    try {
      await apiFetch({
        url: window.api_urls.scratch_org_refresh(org.id),
        dispatch,
        opts: {
          method: 'POST',
        },
      });
      return dispatch({
        type: 'SCRATCH_ORG_REFRESH_ACCEPTED' as const,
        payload: org,
      });
    } catch (err) {
      dispatch({
        type: 'SCRATCH_ORG_REFRESH_REJECTED',
        payload: org,
      });
      throw err;
    }
  };

export const orgRefreshed =
  ({
    model,
    originating_user_id,
  }: {
    model: Org;
    originating_user_id: string | null;
  }): ThunkResult<OrgUpdated> =>
  (dispatch, getState) => {
    const state = getState();
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      let msg = t('Successfully refreshed your {{orgType}}.', { orgType });

      /* istanbul ignore else */
      if (name && parent) {
        msg = t(
          'Successfully refreshed your {{orgType}} for {{parent}} “{{name}}.”',
          { parent, name, orgType },
        );
      }
      dispatch(addToast({ heading: msg }));
    }
    return dispatch(updateOrg(model));
  };

export const refreshError =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Org | MinimalOrg;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<OrgUpdated | OrgRefreshRejected> =>
  (dispatch, getState) => {
    const state = getState();
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      let msg = t('Uh oh. There was an error refreshing your {{orgType}}.', {
        orgType,
      });

      /* istanbul ignore else */
      if (name && parent) {
        msg = t(
          'Uh oh. There was an error refreshing your {{orgType}} for {{parent}} “{{name}}.”',
          { parent, name, orgType },
        );
      }
      dispatch(
        addToast({
          heading: msg,
          details: message,
          variant: 'error',
        }),
      );
    }
    if ((model as Org).owner) {
      return dispatch(updateOrg(model as Org));
    }
    return dispatch({
      type: 'SCRATCH_ORG_REFRESH_REJECTED',
      payload: model,
    });
  };

export const recreateOrg =
  (model: Org): ThunkResult<OrgRecreated> =>
  (dispatch) => {
    /* istanbul ignore else */
    if (window.socket) {
      window.socket.subscribe({
        model: OBJECT_TYPES.ORG,
        id: model.id,
      });
    }
    return dispatch({
      type: 'SCRATCH_ORG_RECREATE',
      payload: model,
    });
  };

export const orgReassigned = (model: Org): OrgReassigned => ({
  type: 'SCRATCH_ORG_REASSIGN',
  payload: model,
});

export const orgReassignFailed =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Org;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<OrgReassignFailed> =>
  (dispatch, getState) => {
    const state = getState();
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      let msg = t('Uh oh. There was an error reassigning this {{orgType}}.', {
        orgType,
      });

      /* istanbul ignore else */
      if (name && parent) {
        msg = t(
          'Uh oh. There was an error reassigning the {{orgType}} for {{parent}} “{{name}}.”',
          { parent, name, orgType },
        );
      }
      dispatch(
        addToast({
          heading: msg,
          details: message,
          variant: 'error',
        }),
      );
    }
    return dispatch({
      type: 'SCRATCH_ORG_REASSIGN_FAILED',
      payload: model,
    });
  };

export const orgProvisioning =
  (model: Org): ThunkResult<OrgProvisioning | null> =>
  (dispatch, getState) => {
    /* istanbul ignore else */
    if (
      model.org_type !== ORG_TYPES.PLAYGROUND ||
      isCurrentUser(model.owner, getState())
    ) {
      /* istanbul ignore else */
      if (window.socket) {
        window.socket.subscribe({
          model: OBJECT_TYPES.ORG,
          id: model.id,
        });
      }
      return dispatch({
        type: 'SCRATCH_ORG_PROVISIONING' as const,
        payload: model,
      });
    }
    return null;
  };

export const orgConvertFailed =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Org | MinimalOrg;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<void> =>
  (dispatch, getState, history) => {
    const state = getState();
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, state)) {
      const { name, parent, orgType } = getOrgParent(model, state);
      let msg = t(
        'Uh oh. There was an error contributing work from your {{orgType}}.',
        { orgType },
      );

      /* istanbul ignore else */
      if (name && parent) {
        msg = t(
          'Uh oh. There was an error contributing work from your {{orgType}} on {{parent}} “{{name}}.”',
          { parent, name, orgType },
        );
      }
      dispatch(
        addToast({
          heading: msg,
          details: message,
          variant: 'error',
        }),
      );
    }
    history.replace({ state: {} });
  };

export const refreshDatasets =
  (org: string): ThunkResult<Promise<RefreshDatasetsAction>> =>
  async (dispatch) => {
    dispatch({
      type: 'REFRESH_DATASETS_REQUESTED',
      payload: org,
    });
    try {
      await apiFetch({
        url: window.api_urls.scratch_org_parse_datasets(org),
        dispatch,
        opts: {
          method: 'POST',
        },
      });
      return dispatch({
        type: 'REFRESH_DATASETS_ACCEPTED' as const,
        payload: org,
      });
    } catch (err) {
      dispatch({
        type: 'REFRESH_DATASETS_REJECTED',
        payload: org,
      });
      throw err;
    }
  };

export const datasetsRefreshed =
  ({
    model,
    datasets,
    dataset_errors,
    schema,
  }: OrgDatasetRefreshedEvent['payload']): ThunkResult<OrgUpdated> =>
  (dispatch) =>
    dispatch(
      updateOrg({ ...model, datasets, dataset_errors, dataset_schema: schema }),
    );
