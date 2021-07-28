import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/js/store';
import {
  Epic,
  EpicsByProjectState,
  EpicsState,
} from '@/js/store/epics/reducer';
import { Project } from '@/js/store/projects/reducer';
import { selectProject } from '@/js/store/projects/selectors';

export const selectEpicState = (appState: AppState): EpicsState =>
  appState.epics;

export const selectEpicsByProject = createSelector(
  [selectEpicState, selectProject],
  (
    epics: EpicsState,
    project?: Project | null,
  ): EpicsByProjectState | undefined => {
    /* istanbul ignore else */
    if (project) {
      return epics[project.id];
    }
    return undefined;
  },
);

export const selectEpicSlug = (
  appState: AppState,
  { match: { params } }: RouteComponentProps<{ epicSlug?: string }>,
) => params.epicSlug;

export const selectEpicNotFound = createSelector(
  [selectEpicsByProject, selectEpicSlug],
  (
    epics: EpicsByProjectState | undefined,
    epicSlug: string | undefined,
  ): boolean => Boolean(epicSlug && epics?.notFound.includes(epicSlug)),
);

export const selectEpic = createSelector(
  [selectEpicsByProject, selectEpicSlug, selectEpicNotFound],
  (epics, epicSlug, notFound): Epic | null | undefined => {
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

export const selectEpicById = (
  appState: AppState,
  id?: string | null,
): Epic | undefined => {
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
