import i18n from 'i18next';

import { ThunkResult } from '@/js/store';
import { fetchObjects, FetchObjectsSucceeded } from '@/js/store/actions';
import { isCurrentUser } from '@/js/store/helpers';
import { Project } from '@/js/store/projects/reducer';
import { addToast } from '@/js/store/toasts/actions';
import apiFetch from '@/js/utils/api';
import { OBJECT_TYPES } from '@/js/utils/constants';

interface ProjectUpdated {
  type: 'PROJECT_UPDATE';
  payload: Project;
}
interface ProjectUpdateError {
  type: 'PROJECT_UPDATE_ERROR';
  payload: Project;
}
interface RefreshProjectsRequested {
  type: 'REFRESH_PROJECTS_REQUESTED';
}
interface RefreshProjectsAccepted {
  type: 'REFRESH_PROJECTS_ACCEPTED';
}
interface RefreshProjectsRejected {
  type: 'REFRESH_PROJECTS_REJECTED';
}
interface ProjectsRefreshing {
  type: 'REFRESHING_PROJECTS';
}
export interface ProjectsRefreshed {
  type: 'PROJECTS_REFRESHED';
}
export interface ProjectsRefreshError {
  type: 'REFRESH_PROJECTS_ERROR';
}
interface RefreshGitHubUsersRequested {
  type: 'REFRESH_GH_USERS_REQUESTED';
  payload: string;
}
interface RefreshGitHubUsersAccepted {
  type: 'REFRESH_GH_USERS_ACCEPTED';
  payload: string;
}
interface RefreshGitHubUsersRejected {
  type: 'REFRESH_GH_USERS_REJECTED';
  payload: string;
}
interface RefreshOrgConfigsAction {
  type:
    | 'REFRESH_ORG_CONFIGS_REQUESTED'
    | 'REFRESH_ORG_CONFIGS_ACCEPTED'
    | 'REFRESH_ORG_CONFIGS_REJECTED';
  payload: string;
}

export type ProjectsAction =
  | ProjectUpdated
  | ProjectUpdateError
  | RefreshProjectsRequested
  | RefreshProjectsAccepted
  | RefreshProjectsRejected
  | ProjectsRefreshing
  | ProjectsRefreshed
  | ProjectsRefreshError
  | RefreshGitHubUsersRequested
  | RefreshGitHubUsersAccepted
  | RefreshGitHubUsersRejected
  | RefreshOrgConfigsAction;

export const refreshProjects =
  (): ThunkResult<Promise<RefreshProjectsAccepted>> => async (dispatch) => {
    dispatch({ type: 'REFRESH_PROJECTS_REQUESTED' });
    try {
      await apiFetch({
        url: window.api_urls.current_user_refresh(),
        dispatch,
        opts: {
          method: 'POST',
        },
      });
      return dispatch({
        type: 'REFRESH_PROJECTS_ACCEPTED' as const,
      });
    } catch (err) {
      dispatch({ type: 'REFRESH_PROJECTS_REJECTED' });
      throw err;
    }
  };

export const projectsRefreshing = (): ProjectsRefreshing => ({
  type: 'REFRESHING_PROJECTS',
});

export const projectsRefreshed =
  (): ThunkResult<Promise<FetchObjectsSucceeded>> => (dispatch) => {
    dispatch({ type: 'PROJECTS_REFRESHED' });
    return dispatch(
      fetchObjects({
        objectType: OBJECT_TYPES.PROJECT,
        reset: true,
      }),
    );
  };

export const projectsRefreshError =
  (message?: string): ThunkResult<ProjectsRefreshError> =>
  (dispatch) => {
    dispatch(
      addToast({
        heading: i18n.t('Uh oh. There was an error re-syncing Projects.'),
        details: message,
        variant: 'error',
      }),
    );
    return dispatch({ type: 'REFRESH_PROJECTS_ERROR' });
  };

export const refreshGitHubUsers =
  (projectId: string): ThunkResult<Promise<RefreshGitHubUsersAccepted>> =>
  async (dispatch) => {
    dispatch({ type: 'REFRESH_GH_USERS_REQUESTED', payload: projectId });
    try {
      await apiFetch({
        url: window.api_urls.project_refresh_github_users(projectId),
        dispatch,
        opts: {
          method: 'POST',
        },
      });
      return dispatch({
        type: 'REFRESH_GH_USERS_ACCEPTED' as const,
        payload: projectId,
      });
    } catch (err) {
      dispatch({ type: 'REFRESH_GH_USERS_REJECTED', payload: projectId });
      throw err;
    }
  };

export const updateProject = (payload: Project): ProjectUpdated => ({
  type: 'PROJECT_UPDATE',
  payload,
});

export const projectError =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Project;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<ProjectUpdated> =>
  (dispatch, getState) => {
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading: i18n.t(
            'Uh oh. There was an error re-syncing GitHub Collaborators for this Project: “{{project_name}}.”',
            { project_name: model.name },
          ),
          details: message,
          variant: 'error',
        }),
      );
    }

    return dispatch(updateProject(model));
  };

export const refreshOrgConfigs =
  (id: string): ThunkResult<Promise<RefreshOrgConfigsAction>> =>
  async (dispatch) => {
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
