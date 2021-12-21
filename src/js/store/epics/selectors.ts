import { createSelector } from 'reselect';

import { AppState, RouteProps } from '@/js/store';
import { selectProject } from '@/js/store/projects/selectors';

export const selectEpicState = (appState: AppState) => appState.epics;

export const selectEpicsByProject = createSelector(
  [selectEpicState, selectProject],
  (epics, project) => {
    /* istanbul ignore else */
    if (project) {
      return epics[project.id];
    }
    return undefined;
  },
);

export const selectEpicSlug = (
  appState: AppState,
  { match: { params } }: RouteProps,
) => params.epicSlug;

export const selectEpicNotFound = createSelector(
  [selectEpicsByProject, selectEpicSlug],
  (epics, epicSlug) => Boolean(epicSlug && epics?.notFound?.includes(epicSlug)),
);

export const selectEpic = createSelector(
  [selectEpicsByProject, selectEpicSlug, selectEpicNotFound],
  (epics, epicSlug, notFound) => {
    if (!epicSlug || !epics) {
      return undefined;
    }
    const epic = epics.epics.find(
      (e) => e.slug === epicSlug || e.old_slugs.includes(epicSlug),
    );
    if (epic) {
      return epic;
    }
    return notFound ? null : undefined;
  },
);

export const selectEpicById = (appState: AppState, id?: string | null) => {
  if (!id) {
    return undefined;
  }
  for (const epicsByProject of Object.values(appState.epics)) {
    const epic = epicsByProject.epics.find((e) => e.id === id);
    if (epic) {
      return epic;
    }
  }
  return undefined;
};
