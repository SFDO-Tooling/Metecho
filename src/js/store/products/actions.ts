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

export type ProductsAction =
  | SyncReposStarted
  | SyncReposSucceeded
  | SyncReposFailed;

export const syncRepos = (): ThunkResult => async dispatch => {
  dispatch({ type: 'SYNC_REPOS_STARTED' });
  try {
    await apiFetch(window.api_urls.user_refresh(), dispatch, {
      method: 'POST',
    });
    dispatch({ type: 'SYNC_REPOS_SUCCEEDED' });
    return dispatch(
      fetchObjects({ objectType: OBJECT_TYPES.PRODUCT, reset: true }),
    );
  } catch (err) {
    dispatch({ type: 'SYNC_REPOS_FAILED' });
    throw err;
  }
};
