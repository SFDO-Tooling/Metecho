import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { Epic, EpicsByProjectState, EpicsState } from '@/store/epics/reducer';
import { Project } from '@/store/projects/reducer';
import { selectProject } from '@/store/projects/selectors';

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
  (epics, epicSlug): boolean =>
    Boolean(epicSlug && epics?.notFound.includes(epicSlug)),
);

export const selectEpic = createSelector(
  [selectEpicsByProject, selectEpicSlug, selectEpicNotFound],
  (epics, epicSlug, notFound): Epic | null | undefined => {
    if (!epicSlug || !epics) {
      return undefined;
    }
    const epic = epics.epics.find(
      (p) => p.slug === epicSlug || p.old_slugs.includes(epicSlug),
    );
    if (epic) {
      return epic;
    }
    return notFound ? null : undefined;
  },
);
