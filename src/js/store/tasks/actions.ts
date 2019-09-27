import { Task } from '@/store/tasks/reducer';
import { addToast } from '@/store/toasts/actions';

interface TaskUpdated {
  type: 'TASK_UPDATE';
  payload: Task;
}

export type TaskAction = TaskUpdated;

export const updateTask = (payload: Task): TaskUpdated => ({
  type: 'TASK_UPDATE',
  payload,
});

export const submitTask = (payload: any): ThunkResult => (
  dispatch,
  getState,
) => {
  dispatch(
    addToast({
      heading: 'Success!',
    }),
  );
};
