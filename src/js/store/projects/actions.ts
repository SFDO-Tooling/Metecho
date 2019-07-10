import { ThunkResult } from '@/store';
// import { Product } from '@/store/products/reducer';
import apiFetch from '@/utils/api';

interface CreateProjectStarted {
  type: 'SYNC_REPOS_STARTED';
}
interface CreateProjectSucceeded {
  type: 'SYNC_REPOS_SUCCEEDED';
}
interface CreateProjectFailed {
  type: 'SYNC_REPOS_FAILED';
}

export type ProjectAction =
  | CreateProjectStarted
  | CreateProjectSucceeded
  | CreateProjectFailed;

export const createProject = (filters): ThunkResult => async dispatch => {
  dispatch({ type: 'CREATE_PROJECT_STARTED' });
  try {
    const response = await apiFetch(window.api_urls.project_list(), dispatch, {
      method: 'POST',
      body: JSON.stringify(filters),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(response);
    return dispatch({ type: 'CREATE_PROJECT_SUCCEEDED' });
  } catch (err) {
    dispatch({ type: 'CREATE_PROJECT_FAILED' });
    throw err;
  }
};
