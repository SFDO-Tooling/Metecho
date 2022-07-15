import { t } from 'i18next';

import { ThunkResult } from '@/js/store';
import { isCurrentUser } from '@/js/store/helpers';
import { Task } from '@/js/store/tasks/reducer';
import { addToast } from '@/js/store/toasts/actions';
import apiFetch from '@/js/utils/api';

interface TaskCreated {
  type: 'TASK_CREATE';
  payload: Task;
}
interface TaskUpdated {
  type: 'TASK_UPDATE';
  payload: Task;
}
interface TaskCreatePRFailed {
  type: 'TASK_CREATE_PR_FAILED';
  payload: Task;
}
interface RefreshDatasetsAction {
  type:
    | 'REFRESH_DATASETS_REQUESTED'
    | 'REFRESH_DATASETS_ACCEPTED'
    | 'REFRESH_DATASETS_REJECTED';
  payload: { project: string; task: string };
}

export type TaskAction =
  | TaskCreated
  | TaskUpdated
  | TaskCreatePRFailed
  | RefreshDatasetsAction;

export const createTask = (payload: Task): TaskCreated => ({
  type: 'TASK_CREATE',
  payload,
});

export const updateTask = (payload: Task): TaskUpdated => ({
  type: 'TASK_UPDATE',
  payload,
});

export const createTaskPR =
  ({
    model,
    originating_user_id,
  }: {
    model: Task;
    originating_user_id: string | null;
  }): ThunkResult<TaskUpdated> =>
  (dispatch, getState) => {
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading: t(
            'Successfully submitted Task for testing: “{{task_name}}.”',
            { task_name: model.name },
          ),
          linkText: model.pr_url ? t('View pull request.') : undefined,
          linkUrl: model.pr_url ? model.pr_url : undefined,
          openLinkInNewWindow: true,
        }),
      );
    }

    return dispatch(updateTask(model));
  };

export const createTaskPRFailed =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Task;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<TaskCreatePRFailed> =>
  (dispatch, getState) => {
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading: t(
            'Uh oh. There was an error submitting Task for testing: “{{task_name}}.”',
            { task_name: model.name },
          ),
          details: message,
          variant: 'error',
        }),
      );
    }

    return dispatch({
      type: 'TASK_CREATE_PR_FAILED' as const,
      payload: model,
    });
  };

export const submitReview =
  ({
    model,
    originating_user_id,
  }: {
    model: Task;
    originating_user_id: string | null;
  }): ThunkResult<TaskUpdated> =>
  (dispatch, getState) => {
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading: t(
            'Successfully submitted review for Task: “{{task_name}}.”',
            { task_name: model.name },
          ),
          linkText: model.pr_url ? t('View pull request.') : undefined,
          linkUrl: model.pr_url ? model.pr_url : undefined,
          openLinkInNewWindow: true,
        }),
      );
    }

    return dispatch(updateTask(model));
  };

export const submitReviewFailed =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Task;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<TaskUpdated> =>
  (dispatch, getState) => {
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading: t(
            'Uh oh. There was an error submitting review for Task: “{{task_name}}.”',
            { task_name: model.name },
          ),
          details: message,
          variant: 'error',
        }),
      );
    }

    return dispatch(updateTask(model));
  };

export const refreshDatasets =
  ({
    project,
    task,
  }: {
    project: string;
    task: string;
  }): ThunkResult<Promise<RefreshDatasetsAction>> =>
  // eslint-disable-next-line require-await
  async (dispatch) => {
    dispatch({
      type: 'REFRESH_DATASETS_REQUESTED',
      payload: { project, task },
    });
    try {
      await apiFetch({
        url: window.api_urls.task_refresh_datasets(task),
        dispatch,
        opts: {
          method: 'POST',
        },
      });
      return dispatch({
        type: 'REFRESH_DATASETS_ACCEPTED' as const,
        payload: { project, task },
      });
    } catch (err) {
      dispatch({
        type: 'REFRESH_DATASETS_REJECTED',
        payload: { project, task },
      });
      throw err;
    }
  };
