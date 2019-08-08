import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { selectProject } from '@/store/projects/selectors';
import { Task, TaskState } from '@/store/tasks/reducer';

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

export const selectTaskSlug = (
  appState: AppState,
  { match: { params } }: RouteComponentProps<{ taskSlug?: string }>,
) => params.taskSlug;

export const selectTask = createSelector(
  [selectTasksByProject, selectTaskSlug],
  (tasks: Task[], slug: string) => {
    /* istanbul ignore else */
    if (tasks) {
      return tasks.find(t => t.slug === slug);
    }
    return undefined;
  },
);
