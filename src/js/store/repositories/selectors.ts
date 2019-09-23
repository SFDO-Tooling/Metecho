import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { RepositoriesState, Repository } from '@/store/repositories/reducer';

export const selectRepositoriesState = (
  appState: AppState,
): RepositoriesState => appState.repositories;

export const selectRepositories = createSelector(
  selectRepositoriesState,
  (repositories: RepositoriesState): Repository[] => repositories.repositories,
);

export const selectReposRefreshing = createSelector(
  selectRepositoriesState,
  (repositories: RepositoriesState): boolean => repositories.refreshing,
);

export const selectNextUrl = createSelector(
  selectRepositoriesState,
  (repositories: RepositoriesState): string | null => repositories.next,
);

export const selectRepositorySlug = (
  appState: AppState,
  { match: { params } }: RouteComponentProps<{ repositorySlug?: string }>,
) => params.repositorySlug;

export const selectRepositoryNotFound = createSelector(
  [selectRepositoriesState, selectRepositorySlug],
  (repositories, repositorySlug): boolean =>
    Boolean(repositorySlug && repositories.notFound.includes(repositorySlug)),
);

export const selectRepository = createSelector(
  [selectRepositories, selectRepositorySlug, selectRepositoryNotFound],
  (repositories, repositorySlug, notFound): Repository | null | undefined => {
    if (!repositorySlug) {
      return undefined;
    }
    const repository = repositories.find(
      p => p.slug === repositorySlug || p.old_slugs.includes(repositorySlug),
    );
    if (repository) {
      return repository;
    }
    return notFound ? null : undefined;
  },
);
