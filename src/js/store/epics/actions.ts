import i18n from 'i18next';

import { ThunkResult } from '@/store';
import { Epic } from '@/store/epics/reducer';
import { isCurrentUser } from '@/store/helpers';
import { addToast } from '@/store/toasts/actions';
import apiFetch from '@/utils/api';

interface EpicUpdated {
  type: 'EPIC_UPDATE';
  payload: Epic;
}
interface EpicCreatePRFailed {
  type: 'EPIC_CREATE_PR_FAILED';
  payload: Epic;
}
interface RefreshOrgConfigsAction {
  type:
    | 'REFRESH_ORG_CONFIGS_REQUESTED'
    | 'REFRESH_ORG_CONFIGS_ACCEPTED'
    | 'REFRESH_ORG_CONFIGS_REJECTED';
  payload: string;
}

export type EpicAction =
  | EpicUpdated
  | EpicCreatePRFailed
  | RefreshOrgConfigsAction;

export const updateEpic = (payload: Epic): EpicUpdated => ({
  type: 'EPIC_UPDATE',
  payload,
});

export const createEpicPR = ({
  model,
  originating_user_id,
}: {
  model: Epic;
  originating_user_id: string | null;
}): ThunkResult<EpicUpdated> => (dispatch, getState) => {
  /* istanbul ignore else */
  if (isCurrentUser(originating_user_id, getState())) {
    dispatch(
      addToast({
        heading: `${i18n.t(
          'Successfully submitted epic for review on GitHub:',
        )} “${model.name}”.`,
        linkText: model.pr_url ? i18n.t('View pull request.') : undefined,
        linkUrl: model.pr_url ? model.pr_url : undefined,
        openLinkInNewWindow: true,
      }),
    );
  }

  return dispatch({
    type: 'EPIC_UPDATE' as const,
    payload: model,
  });
};

export const createEpicPRFailed = ({
  model,
  message,
  originating_user_id,
}: {
  model: Epic;
  message?: string;
  originating_user_id: string | null;
}): ThunkResult<EpicCreatePRFailed> => (dispatch, getState) => {
  /* istanbul ignore else */
  if (isCurrentUser(originating_user_id, getState())) {
    dispatch(
      addToast({
        heading: `${i18n.t(
          'Uh oh. There was an error submitting epic for review on GitHub',
        )}: “${model.name}”.`,
        details: message,
        variant: 'error',
      }),
    );
  }
  return dispatch({
    type: 'EPIC_CREATE_PR_FAILED' as const,
    payload: model,
  });
};

export const refreshOrgConfigs = (
  id: string,
): ThunkResult<Promise<RefreshOrgConfigsAction>> => async (dispatch) => {
  dispatch({ type: 'REFRESH_ORG_CONFIGS_REQUESTED', payload: id });
  try {
    await apiFetch({
      url: window.api_urls.epic_refresh_org_config_names(id),
      dispatch,
      opts: {
        method: 'POST',
      },
    });
    return dispatch({
      type: 'REFRESH_ORG_CONFIGS_ACCEPTED' as const,
      payload: id,
    });
  } catch (err) {
    dispatch({ type: 'REFRESH_ORG_CONFIGS_REJECTED', payload: id });
    throw err;
  }
};
