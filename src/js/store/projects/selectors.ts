import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { Product } from '@/store/products/reducer';
import { selectProduct } from '@/store/products/selectors';
import {
  Project,
  ProjectsByProductState,
  ProjectsState,
} from '@/store/projects/reducer';

export const selectProjectState = (appState: AppState): ProjectsState =>
  appState.projects;

export const selectProjectsByProduct = createSelector(
  [selectProjectState, selectProduct],
  (
    projects: ProjectsState,
    product?: Product | null,
  ): ProjectsByProductState | undefined => {
    /* istanbul ignore else */
    if (product) {
      return projects[product.id];
    }
    return undefined;
  },
);

export const selectProjectSlug = (
  appState: AppState,
  { match: { params } }: RouteComponentProps<{ projectSlug?: string }>,
) => params.projectSlug;

export const selectProjectNotFound = createSelector(
  [selectProjectsByProduct, selectProjectSlug],
  (projects, projectSlug): boolean =>
    Boolean(projectSlug && projects && projects.notFound.includes(projectSlug)),
);

export const selectProject = createSelector(
  [selectProjectsByProduct, selectProjectSlug, selectProjectNotFound],
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
