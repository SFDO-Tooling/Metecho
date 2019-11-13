import { ThunkResult } from '@/store';
import { fetchObjects } from '@/store/actions';
import apiFetch from '@/utils/api';
import { OBJECT_TYPES } from '@/utils/constants';

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

export type RepositoriesAction =
  | RefreshReposRequested
  | RefreshReposAccepted
  | RefreshReposRejected
  | ReposRefreshing
  | ReposRefreshed;

export const refreshRepos = (): ThunkResult => async (dispatch) => {
  dispatch({ type: 'REFRESH_REPOS_REQUESTED' });
  try {
    await apiFetch({
      url: window.api_urls.user_refresh(),
      dispatch,
      opts: {
        method: 'POST',
      },
    });
    return dispatch({ type: 'REFRESH_REPOS_ACCEPTED' });
  } catch (err) {
    dispatch({ type: 'REFRESH_REPOS_REJECTED' });
    throw err;
  }
};

export const reposRefreshing = (): ReposRefreshing => ({
  type: 'REFRESHING_REPOS',
});

export const reposRefreshed = (): ThunkResult => (dispatch) => {
  dispatch({ type: 'REPOS_REFRESHED' });
  return dispatch(
    fetchObjects({ objectType: OBJECT_TYPES.REPOSITORY, reset: true }),
  );
};
