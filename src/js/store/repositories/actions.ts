import { ThunkResult } from '@/store';
import { fetchObjects } from '@/store/actions';
import apiFetch from '@/utils/api';
import { OBJECT_TYPES } from '@/utils/constants';

interface SyncReposStarted {
  type: 'SYNC_REPOS_STARTED';
}
interface SyncReposSucceeded {
  type: 'SYNC_REPOS_SUCCEEDED';
}
interface SyncReposFailed {
  type: 'SYNC_REPOS_FAILED';
}

export type RepositoriesAction =
  | SyncReposStarted
  | SyncReposSucceeded
  | SyncReposFailed;

export const syncRepos = (): ThunkResult => async dispatch => {
  dispatch({ type: 'SYNC_REPOS_STARTED' });
  try {
    await apiFetch({
      url: window.api_urls.user_refresh(),
      dispatch,
      opts: {
        method: 'POST',
      },
    });
    dispatch({ type: 'SYNC_REPOS_SUCCEEDED' });
    return dispatch(
      fetchObjects({ objectType: OBJECT_TYPES.REPOSITORY, reset: true }),
    );
  } catch (err) {
    dispatch({ type: 'SYNC_REPOS_FAILED' });
    throw err;
  }
};
