import { createSelector } from 'reselect';

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
