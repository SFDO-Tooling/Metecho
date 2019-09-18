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
  (tasks, slug) => {
    if (!tasks || !slug) {
      return undefined;
    }
    const task = tasks.find(t => t.slug === slug || t.old_slugs.includes(slug));
    return task || null;
  },
);

export const selectTaskById = (
  appState: AppState,
  id: string,
): Task | undefined =>
  Object.values(appState.tasks)
    .flat()
    .find(t => t.id === id);
