import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/js/store';
import { selectEpic } from '@/js/store/epics/selectors';
import { Task, TaskState } from '@/js/store/tasks/reducer';

export const selectTaskState = (appState: AppState): TaskState =>
  appState.tasks;

export const selectTasksByEpic = createSelector(
  [selectTaskState, selectEpic],
  (tasks, epic) => {
    /* istanbul ignore else */
    if (epic) {
      return tasks[epic.id];
    }
    return undefined;
  },
);

export const selectTaskSlug = (
  appState: AppState,
  { match: { params } }: RouteComponentProps<{ taskSlug?: string }>,
) => params.taskSlug;

export const selectTask = createSelector(
  [selectTasksByEpic, selectTaskSlug],
  (tasks, slug): Task | null | undefined => {
    if (!tasks || !slug) {
      return undefined;
    }
    const task = tasks.find(
      (t) => t.slug === slug || t.old_slugs.includes(slug),
    );
    return task || null;
  },
);

export const selectTaskById = (
  appState: AppState,
  id?: string | null,
): Task | undefined =>
  Object.values(appState.tasks)
    .flat()
    .find((t) => t.id === id);
