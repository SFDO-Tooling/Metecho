import i18n from 'i18next';

import { ThunkResult } from '@/store';
import { isCurrentUser } from '@/store/helpers';
import { Project } from '@/store/projects/reducer';
import { addToast } from '@/store/toasts/actions';
import apiFetch from '@/utils/api';

interface ProjectUpdated {
  type: 'PROJECT_UPDATE';
  payload: Project;
}
interface ProjectCreatePRFailed {
  type: 'PROJECT_CREATE_PR_FAILED';
  payload: Project;
}
interface RefreshOrgConfigsAction {
  type:
    | 'REFRESH_ORG_CONFIGS_REQUESTED'
    | 'REFRESH_ORG_CONFIGS_ACCEPTED'
    | 'REFRESH_ORG_CONFIGS_REJECTED';
  payload: string;
}

export type ProjectAction =
  | ProjectUpdated
  | ProjectCreatePRFailed
  | RefreshOrgConfigsAction;

export const updateProject = (payload: Project): ProjectUpdated => ({
  type: 'PROJECT_UPDATE',
  payload,
});

export const createProjectPR = ({
  model,
  originating_user_id,
}: {
  model: Project;
  originating_user_id: string | null;
}): ThunkResult<ProjectUpdated> => (dispatch, getState) => {
  /* istanbul ignore else */
  if (isCurrentUser(originating_user_id, getState())) {
    dispatch(
      addToast({
        heading: `${i18n.t(
          'Successfully submitted project for review on GitHub:',
        )} “${model.name}”.`,
        linkText: model.pr_url ? i18n.t('View pull request.') : undefined,
        linkUrl: model.pr_url ? model.pr_url : undefined,
        openLinkInNewWindow: true,
      }),
    );
  }

  return dispatch({
    type: 'PROJECT_UPDATE' as const,
    payload: model,
  });
};

export const createProjectPRFailed = ({
  model,
  message,
  originating_user_id,
}: {
  model: Project;
  message?: string;
  originating_user_id: string | null;
}): ThunkResult<ProjectCreatePRFailed> => (dispatch, getState) => {
  /* istanbul ignore else */
  if (isCurrentUser(originating_user_id, getState())) {
    dispatch(
      addToast({
        heading: `${i18n.t(
          'Uh oh. There was an error submitting project for review on GitHub',
        )}: “${model.name}”.`,
        details: message,
        variant: 'error',
      }),
    );
  }
  return dispatch({
    type: 'PROJECT_CREATE_PR_FAILED' as const,
    payload: model,
  });
};

export const refreshOrgConfigs = (
  id: string,
): ThunkResult<Promise<RefreshOrgConfigsAction>> => async (dispatch) => {
  dispatch({ type: 'REFRESH_ORG_CONFIGS_REQUESTED', payload: id });
  try {
    await apiFetch({
      url: window.api_urls.project_refresh_org_config_names(id),
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
