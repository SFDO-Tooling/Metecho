import { createSelector } from 'reselect';
import { RouteComponentProps } from 'react-router-dom';

import { AppState } from '@/store';
import { Product } from '@/store/products/reducer';
import { selectProduct } from '@/store/products/selectors';
import { ProjectsState } from '@/store/projects/reducer';

export const selectProjectState = (appState: AppState): ProjectsState =>
  appState.projects;

export const selectProjectsByProduct = createSelector(
  [selectProjectState, selectProduct],
  (
    projects: ProjectsState,
    product: Product | null | undefined,
  ): { [x: string]: Product } | undefined => {
    if (product) {
      const project: any = projects[product.id];
      return project;
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
  (projects, projectSlug): boolean => Boolean(projectSlug && projects),
);
export const selectProject = createSelector(
  [selectProjectsByProduct, selectProjectSlug, selectProjectNotFound],
  (projects, projectSlug, notFound) => {
    if (!projectSlug) {
      return undefined;
    }
    if (projects) {
      for (const key in projects) {
        if (projects.hasOwnProperty(key)) {
          const project = projects[key];
          if (project.slug === projectSlug) {
            return project;
          }
        }
      }
    }
    return notFound ? null : undefined;
  },
);
