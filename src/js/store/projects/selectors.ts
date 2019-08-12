import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { Repository } from '@/store/repositories/reducer';
import { selectRepository } from '@/store/repositories/selectors';
import {
  Project,
  ProjectsByRepositoryState,
  ProjectsState,
} from '@/store/projects/reducer';

export const selectProjectState = (appState: AppState): ProjectsState =>
  appState.projects;

export const selectProjectsByRepository = createSelector(
  [selectProjectState, selectRepository],
  (
    projects: ProjectsState,
    repository?: Repository | null,
  ): ProjectsByRepositoryState | undefined => {
    /* istanbul ignore else */
    if (repository) {
      return projects[repository.id];
    }
    return undefined;
  },
);

export const selectProjectSlug = (
  appState: AppState,
  { match: { params } }: RouteComponentProps<{ projectSlug?: string }>,
) => params.projectSlug;

export const selectProjectNotFound = createSelector(
  [selectProjectsByRepository, selectProjectSlug],
  (projects, projectSlug): boolean =>
    Boolean(projectSlug && projects && projects.notFound.includes(projectSlug)),
);

export const selectProject = createSelector(
  [selectProjectsByRepository, selectProjectSlug, selectProjectNotFound],
  (projects, projectSlug, notFound): Project | null | undefined => {
    if (!projectSlug || !projects) {
      return undefined;
    }
    const project = projects.projects.find(
      p => p.slug === projectSlug || p.old_slugs.includes(projectSlug),
    );
    if (project) {
      return project;
    }
    return notFound ? null : undefined;
  },
);
