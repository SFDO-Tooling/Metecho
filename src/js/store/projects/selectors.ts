import { createSelector } from 'reselect';
import { RouteComponentProps } from 'react-router-dom';

import { AppState } from '@/store';
import { Product } from '@/store/products/reducer';
import { selectProduct } from '@/store/products/selectors';
import {
  ProjectsByProductState,
  ProjectsState,
} from '@/store/projects/reducer';

export const selectProjectState = (appState: AppState): ProjectsState =>
  appState.projects;

export const selectProjectsByProduct = createSelector(
  [selectProjectState, selectProduct],
  (
    projects: ProjectsState,
    product: Product | null | undefined,
  ): ProjectsByProductState | undefined => {
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

export const selectProject = createSelector(
  [selectProjectsByProduct, selectProjectSlug],
  (projects, projectSlug) => {
    const project =
      projects &&
      projects.projects.find(
        // @todo dont forget about old_slugs, notFound projects
        p => p.slug === projectSlug,
      );
    return project ? project : undefined;
  },
);
