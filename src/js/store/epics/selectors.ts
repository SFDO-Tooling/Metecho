import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/store';
import {
  Epic,
  EpicsByRepositoryState,
  EpicsState,
} from '@/store/epics/reducer';
import { Repository } from '@/store/repositories/reducer';
import { selectRepository } from '@/store/repositories/selectors';

export const selectEpicState = (appState: AppState): EpicsState =>
  appState.epics;

export const selectEpicsByRepository = createSelector(
  [selectEpicState, selectRepository],
  (
    epics: EpicsState,
    repository?: Repository | null,
  ): EpicsByRepositoryState | undefined => {
    /* istanbul ignore else */
    if (repository) {
      return epics[repository.id];
    }
    return undefined;
  },
);

export const selectEpicSlug = (
  appState: AppState,
  { match: { params } }: RouteComponentProps<{ epicSlug?: string }>,
) => params.epicSlug;

export const selectEpicNotFound = createSelector(
  [selectEpicsByRepository, selectEpicSlug],
  (epics, epicSlug): boolean =>
    Boolean(epicSlug && epics?.notFound.includes(epicSlug)),
);

export const selectEpic = createSelector(
  [selectEpicsByRepository, selectEpicSlug, selectEpicNotFound],
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
