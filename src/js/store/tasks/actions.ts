import i18n from 'i18next';

import { ThunkResult } from '~js/store';
import { isCurrentUser } from '~js/store/helpers';
import { Task } from '~js/store/tasks/reducer';
import { addToast } from '~js/store/toasts/actions';

interface TaskUpdated {
  type: 'TASK_UPDATE';
  payload: Task;
}
interface TaskCreatePRFailed {
  type: 'TASK_CREATE_PR_FAILED';
  payload: Task;
}

export type TaskAction = TaskUpdated | TaskCreatePRFailed;

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
          heading: i18n.t(
            'Successfully submitted task for testing: “{{task_name}}”.',
            { task_name: model.name },
          ),
          linkText: model.pr_url ? i18n.t('View pull request.') : undefined,
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
          heading: i18n.t(
            'Uh oh. There was an error submitting task for testing: “{{task_name}}”.',
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
          heading: i18n.t(
            'Successfully submitted review for task: “{{task_name}}”.',
            { task_name: model.name },
          ),
          linkText: model.pr_url ? i18n.t('View pull request.') : undefined,
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
          heading: i18n.t(
            'Uh oh. There was an error submitting review for task: “{{task_name}}”.',
            { task_name: model.name },
          ),
          details: message,
          variant: 'error',
        }),
      );
    }

    return dispatch(updateTask(model));
  };
