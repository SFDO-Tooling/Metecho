import { createSelector } from 'reselect';
import { AppState } from '@/store';
import { TaskState } from '@/store/tasks/reducer';

export const selectTaskState = (appState: AppState): TaskState =>
  appState.tasks;

export const selectTasksByProject = createSelector(
  [selectTaskState],
  tasks => tasks,
);
