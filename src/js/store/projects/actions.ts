/* eslint-disable @typescript-eslint/camelcase */
import i18n from 'i18next';

import { ThunkResult } from '@/store';
import { Project } from '@/store/projects/reducer';
import { addToast } from '@/store/toasts/actions';

interface ProjectUpdated {
  type: 'PROJECT_UPDATE';
  payload: Project;
}
interface ProjectCreatePRFailed {
  type: 'PROJECT_CREATE_PR_FAILED';
  payload: Project;
}

export type ProjectAction = ProjectUpdated | ProjectCreatePRFailed;

export const updateProject = (payload: Project): ProjectUpdated => ({
  type: 'PROJECT_UPDATE',
  payload,
});

export const createProjectPR = (payload: {
  model: Project;
  originating_user_id: string;
}): ThunkResult => (dispatch, getState) => {
  const { model, originating_user_id } = payload;
  const state = getState();
  const { user } = state;

  if (user?.id === originating_user_id) {
    dispatch(
      addToast({
        heading: `${i18n.t('Successfully submitted project for review')}: “${
          model.name
        }”.`,
        linkText: model.pr_url ? i18n.t('View pull request.') : undefined,
        linkUrl: model.pr_url ? model.pr_url : undefined,
        openLinkInNewWindow: true,
      }),
    );
  }

  return dispatch({
    type: 'PROJECT_UPDATE',
    payload,
  });
};

export const createProjectPRFailed = ({
  model,
  message,
  originating_user_id,
}: {
  model: Project;
  message?: string;
  originating_user_id: string;
}): ThunkResult => (dispatch, getState) => {
  const state = getState();
  const { user } = state;

  if (user?.id === originating_user_id) {
    dispatch(
      addToast({
        heading: `${i18n.t(
          'Uh oh. There was an error submitting project for review',
        )}: “${model.name}”.`,
        details: message,
        variant: 'error',
      }),
    );
  }
  return dispatch({
    type: 'PROJECT_CREATE_PR_FAILED',
    payload: model,
  });
};
