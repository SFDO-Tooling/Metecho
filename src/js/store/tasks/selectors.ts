import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { selectProject } from '@/store/projects/selectors';
import { TaskState } from '@/store/tasks/reducer';

export const selectTaskState = (appState: AppState): TaskState =>
  appState.tasks;

export const selectTasksByProject = createSelector(
  [selectTaskState, selectProject],
  (tasks, project) => {
    /* istanbul ignore else */
    if (project) {
      return tasks[project.id];
    }
    return undefined;
  },
);
