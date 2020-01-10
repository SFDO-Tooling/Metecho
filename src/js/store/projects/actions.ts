import i18n from 'i18next';

import { ThunkResult } from '@/store';
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

export type ProjectAction = ProjectUpdated | ProjectCreatePRFailed;

export const updateProject = (payload: Project): ProjectUpdated => ({
  type: 'PROJECT_UPDATE',
  payload,
});

export const setUsersOnProject = (payload: Project): ThunkResult => async (
  dispatch,
) => {
  try {
    const response = await apiFetch({
      url: window.api_urls.project_detail(payload.id),
      dispatch,
      opts: {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });
    dispatch({ type: 'PROJECT_UPDATE', payload: response });
  } catch (error) {
    console.warn(error);
  }
};

export const createProjectPR = (payload: Project): ThunkResult => (
  dispatch,
) => {
  dispatch(
    addToast({
      heading: `${i18n.t('Successfully submitted project for review')}: “${
        payload.name
      }”.`,
      linkText: payload.pr_url ? i18n.t('View pull request.') : undefined,
      linkUrl: payload.pr_url ? payload.pr_url : undefined,
      openLinkInNewWindow: true,
    }),
  );
  return dispatch({
    type: 'PROJECT_UPDATE',
    payload,
  });
};

export const createProjectPRFailed = ({
  model,
  message,
}: {
  model: Project;
  message?: string;
}): ThunkResult => (dispatch) => {
  dispatch(
    addToast({
      heading: `${i18n.t(
        'Uh oh. There was an error submitting project for review',
      )}: “${model.name}”.`,
      details: message,
      variant: 'error',
    }),
  );
  return dispatch({
    type: 'PROJECT_CREATE_PR_FAILED',
    payload: model,
  });
};
