import { Task } from '@/store/tasks/reducer';

interface TaskUpdated {
  type: 'TASK_UPDATE';
  payload: Task;
}

export type TaskAction = TaskUpdated;

export const updateTask = (payload: Task): TaskUpdated => ({
  type: 'TASK_UPDATE',
  payload,
});
