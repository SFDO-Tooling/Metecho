import i18n from 'i18next';

import { ThunkResult } from '@/store';
import { fetchObjects, FetchObjectsSucceeded } from '@/store/actions';
import { isCurrentUser } from '@/store/helpers';
import { Repository } from '@/store/repositories/reducer';
import { addToast } from '@/store/toasts/actions';
import apiFetch from '@/utils/api';
import { OBJECT_TYPES } from '@/utils/constants';

interface RepoUpdated {
  type: 'REPOSITORY_UPDATE';
  payload: Repository;
}
interface RepoUpdateError {
  type: 'REPOSITORY_UPDATE_ERROR';
  payload: Repository;
}
interface RefreshReposRequested {
  type: 'REFRESH_REPOS_REQUESTED';
}
interface RefreshReposAccepted {
  type: 'REFRESH_REPOS_ACCEPTED';
}
interface RefreshReposRejected {
  type: 'REFRESH_REPOS_REJECTED';
}
interface ReposRefreshing {
  type: 'REFRESHING_REPOS';
}
export interface ReposRefreshed {
  type: 'REPOS_REFRESHED';
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

export type RepositoriesAction =
  | RepoUpdated
  | RepoUpdateError
  | RefreshReposRequested
  | RefreshReposAccepted
  | RefreshReposRejected
  | ReposRefreshing
  | ReposRefreshed
  | RefreshGitHubUsersRequested
  | RefreshGitHubUsersAccepted
  | RefreshGitHubUsersRejected;

export const refreshRepos = (): ThunkResult<
  Promise<RefreshReposAccepted>
> => async (dispatch) => {
  dispatch({ type: 'REFRESH_REPOS_REQUESTED' });
  try {
    await apiFetch({
      url: window.api_urls.user_refresh(),
      dispatch,
      opts: {
        method: 'POST',
      },
    });
    return dispatch({
      type: 'REFRESH_REPOS_ACCEPTED' as const,
    });
  } catch (err) {
    dispatch({ type: 'REFRESH_REPOS_REJECTED' });
    throw err;
  }
};

export const reposRefreshing = (): ReposRefreshing => ({
  type: 'REFRESHING_REPOS',
});

export const reposRefreshed = (): ThunkResult<
  Promise<FetchObjectsSucceeded>
> => (dispatch) => {
  dispatch({ type: 'REPOS_REFRESHED' });
  return dispatch(
    fetchObjects({
      objectType: OBJECT_TYPES.REPOSITORY,
      reset: true,
    }),
  );
};

export const refreshGitHubUsers = (
  repoId: string,
): ThunkResult<Promise<RefreshGitHubUsersAccepted>> => async (dispatch) => {
  dispatch({ type: 'REFRESH_GH_USERS_REQUESTED', payload: repoId });
  try {
    await apiFetch({
      url: window.api_urls.repository_refresh_github_users(repoId),
      dispatch,
      opts: {
        method: 'POST',
      },
    });
    return dispatch({
      type: 'REFRESH_GH_USERS_ACCEPTED' as const,
      payload: repoId,
    });
  } catch (err) {
    dispatch({ type: 'REFRESH_GH_USERS_REJECTED', payload: repoId });
    throw err;
  }
};

export const updateRepo = (payload: Repository): RepoUpdated => ({
  type: 'REPOSITORY_UPDATE',
  payload,
});

export const repoError = ({
  model,
  message,
  originating_user_id,
}: {
  model: Repository;
  message?: string;
  originating_user_id: string | null;
}): ThunkResult<RepoUpdated> => (dispatch, getState) => {
  if (isCurrentUser(originating_user_id, getState())) {
    dispatch(
      addToast({
        heading: `${i18n.t(
          'Uh oh. There was an error re-syncing collaborators for this repository',
        )}: “${model.name}”.`,
        details: message,
        variant: 'error',
      }),
    );
  }

  return dispatch(updateRepo(model));
};
