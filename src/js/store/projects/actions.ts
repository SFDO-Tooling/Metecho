import { t } from 'i18next';

import { ThunkResult } from '@/js/store';
import { fetchObjects, FetchObjectsSucceeded } from '@/js/store/actions';
import { isCurrentUser } from '@/js/store/helpers';
import { Project } from '@/js/store/projects/reducer';
import { selectProjectById } from '@/js/store/projects/selectors';
import { addToast, AddToastAction } from '@/js/store/toasts/actions';
import apiFetch from '@/js/utils/api';
import { OBJECT_TYPES, SHOW_PROJECT_CREATE_ERROR } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

interface ProjectUpdated {
  type: 'PROJECT_UPDATE';
  payload: Project;
}
interface ProjectUpdateError {
  type: 'PROJECT_UPDATE_ERROR';
  payload: Project;
}
interface ProjectDeleted {
  type: 'PROJECT_DELETED';
  payload: string;
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
interface RefreshGitHubIssuesRequested {
  type: 'REFRESH_GH_ISSUES_REQUESTED';
  payload: string;
}
interface RefreshGitHubIssuesAccepted {
  type: 'REFRESH_GH_ISSUES_ACCEPTED';
  payload: string;
}
interface RefreshGitHubIssuesRejected {
  type: 'REFRESH_GH_ISSUES_REJECTED';
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
  | ProjectDeleted
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
  | RefreshGitHubIssuesRequested
  | RefreshGitHubIssuesAccepted
  | RefreshGitHubIssuesRejected
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
        heading: t('Uh oh. There was an error re-syncing Projects.'),
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

export const projectCreated =
  ({
    model,
    originating_user_id,
  }: {
    model: Project;
    originating_user_id: string | null;
  }): ThunkResult<ProjectUpdated> =>
  (dispatch, getState) => {
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading: t(
            'Successfully created GitHub Repository for new Project: “{{project_name}}.”',
            { project_name: model.name },
          ),
          linkText: model.repo_url
            ? t('View Project on GitHub.')
            : /* istanbul ignore next */ undefined,
          linkUrl: model.repo_url
            ? model.repo_url
            : /* istanbul ignore next */ undefined,
          openLinkInNewWindow: true,
        }),
      );
    }

    return dispatch(updateProject(model));
  };

export const addProjectCreateError =
  ({
    name,
    message,
  }: {
    name: string;
    message?: string;
  }): ThunkResult<AddToastAction> =>
  (dispatch) =>
    dispatch(
      addToast({
        heading: t(
          'Uh oh. There was an error creating your new Project: “{{project_name}}.”',
          { project_name: name },
        ),
        details: message,
        variant: 'error',
      }),
    );

export const projectCreateError =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Project;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<ProjectDeleted> =>
  (dispatch, getState, history) => {
    const appState = getState();
    const project = selectProjectById(appState, model.id);
    const currentUser = isCurrentUser(originating_user_id, appState);

    if (
      history.location.pathname ===
      // `model.slug` can be `null` here, so use Project from the store instead
      routes.project_detail(project?.slug || model.slug)
    ) {
      // Redirect to projects-list if still on deleted project page.
      // Error toasts are cleared on navigation, so wait to show message
      // (see <ProjectList> component where message will be shown)
      const state = currentUser
        ? { [SHOW_PROJECT_CREATE_ERROR]: { name: model.name, message } }
        : undefined;
      history.push(routes.project_list(), state);
    } else if (currentUser) {
      dispatch(
        addProjectCreateError({
          name: model.name,
          message,
        }),
      );
    }

    return dispatch({ type: 'PROJECT_DELETED', payload: model.id });
  };

export const projectError =
  ({
    model,
    heading,
    message,
    originating_user_id,
  }: {
    model: Project;
    heading: string;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<ProjectUpdated> =>
  (dispatch, getState) => {
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading,
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

export const refreshGitHubIssues =
  (projectId: string): ThunkResult<Promise<RefreshGitHubIssuesAccepted>> =>
  async (dispatch) => {
    dispatch({ type: 'REFRESH_GH_ISSUES_REQUESTED', payload: projectId });
    try {
      await apiFetch({
        url: window.api_urls.project_refresh_github_issues(projectId),
        dispatch,
        opts: {
          method: 'POST',
        },
      });
      return dispatch({
        type: 'REFRESH_GH_ISSUES_ACCEPTED' as const,
        payload: projectId,
      });
    } catch (err) {
      dispatch({ type: 'REFRESH_GH_ISSUES_REJECTED', payload: projectId });
      throw err;
    }
  };
