import i18n from 'i18next';

import { ThunkResult } from '@/store';
import { Task } from '@/store/tasks/reducer';
import { addToast } from '@/store/toasts/actions';

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

export const createTaskPR = (payload: Task): ThunkResult => (dispatch) => {
  dispatch(
    addToast({
      heading: `${i18n.t('Successfully submitted task for review')}: “${
        payload.name
      }”.`,
      linkText: payload.pr_url ? i18n.t('View pull request.') : undefined,
      linkUrl: payload.pr_url ? payload.pr_url : undefined,
      openLinkInNewWindow: true,
    }),
  );
  return dispatch({
    type: 'TASK_UPDATE',
    payload,
  });
};

export const createTaskPRFailed = ({
  model,
  message,
}: {
  model: Task;
  message?: string;
}): ThunkResult => (dispatch) => {
  dispatch(
    addToast({
      heading: `${i18n.t(
        'Uh oh. There was an error submitting task for review',
      )}: “${model.name}”.`,
      details: message,
      variant: 'error',
    }),
  );
  return dispatch({
    type: 'TASK_CREATE_PR_FAILED',
    payload: model,
  });
};
