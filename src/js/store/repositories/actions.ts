import { ThunkResult } from '@/store';
import apiFetch from '@/utils/api';

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

export type RepositoriesAction =
  | RefreshReposRequested
  | RefreshReposAccepted
  | RefreshReposRejected
  | ReposRefreshing;

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
