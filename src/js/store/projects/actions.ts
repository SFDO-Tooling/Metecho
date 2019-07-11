import { ThunkResult } from '@/store';
import { Project } from '@/store/projects/reducer';
import apiFetch from '@/utils/api';

interface CreateProjectStarted {
  type: 'SYNC_REPOS_STARTED';
}
interface CreateProjectSucceeded {
  type: 'SYNC_REPOS_SUCCEEDED';
  payload: { project: Project };
}
interface CreateProjectFailed {
  type: 'SYNC_REPOS_FAILED';
}

export type ProjectAction =
  | CreateProjectStarted
  | CreateProjectSucceeded
  | CreateProjectFailed;

export const createProject = (
  newProject: Project,
): ThunkResult => async dispatch => {
  dispatch({ type: 'CREATE_PROJECT_STARTED' });
  try {
    const response = await apiFetch(window.api_urls.project_list(), dispatch, {
      method: 'POST',
      body: JSON.stringify(newProject),
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
