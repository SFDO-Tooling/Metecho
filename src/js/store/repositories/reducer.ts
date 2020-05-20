import { ObjectsAction, PaginatedObjectResponse } from '@/store/actions';
import { RepositoriesAction } from '@/store/repositories/actions';
import { LogoutAction } from '@/store/user/actions';
import { GitHubUser } from '@/store/user/reducer';
import { OBJECT_TYPES } from '@/utils/constants';

export interface Repository {
  id: string;
  name: string;
  slug: string;
  old_slugs: string[];
  repo_url: string;
  description: string;
  description_rendered: string;
  is_managed: boolean;
  github_users: GitHubUser[];
  currently_refreshing_gh_users?: boolean;
  repo_image_url: string;
}
export interface RepositoriesState {
  repositories: Repository[];
  next: string | null;
  notFound: string[];
  refreshing: boolean;
}

const defaultState = {
  repositories: [],
  next: null,
  notFound: [],
  refreshing: false,
};

const reducer = (
  repositories: RepositoriesState = defaultState,
  action: RepositoriesAction | ObjectsAction | LogoutAction,
): RepositoriesState => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return { ...defaultState };
    case 'REFRESH_REPOS_REQUESTED':
    case 'REFRESHING_REPOS':
    case 'REFRESH_REPOS_REJECTED': {
      return {
        ...repositories,
        refreshing: action.type !== 'REFRESH_REPOS_REJECTED',
      };
    }
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const { response, objectType, reset } = action.payload;
      const { results, next } = response as PaginatedObjectResponse;
      if (objectType === OBJECT_TYPES.REPOSITORY) {
        if (reset) {
          return {
            ...repositories,
            repositories: results,
            next,
            refreshing: false,
          };
        }
        // Store list of known repository IDs to filter out duplicates
        const ids = repositories.repositories.map((repo) => repo.id);
        return {
          ...repositories,
          repositories: [
            ...repositories.repositories,
            ...results.filter((repo) => !ids.includes(repo.id)),
          ],
          next,
          refreshing: false,
        };
      }
      return repositories;
    }
    case 'FETCH_OBJECT_SUCCEEDED': {
      const {
        object,
        filters: { slug },
        objectType,
      } = action.payload;
      if (objectType === OBJECT_TYPES.REPOSITORY) {
        if (!object) {
          return {
            ...repositories,
            notFound: [...repositories.notFound, slug],
          };
        }
        if (!repositories.repositories.find((repo) => repo.id === object.id)) {
          return {
            ...repositories,
            repositories: [...repositories.repositories, object],
          };
        }
      }
      return repositories;
    }
    case 'REFRESH_GH_USERS_REQUESTED':
    case 'REFRESH_GH_USERS_REJECTED': {
      const repoId = action.payload;
      if (repositories.repositories.find((repo) => repo.id === repoId)) {
        return {
          ...repositories,
          repositories: repositories.repositories.map((repo) => {
            if (repo.id === repoId) {
              return {
                ...repo,
                currently_refreshing_gh_users:
                  action.type === 'REFRESH_GH_USERS_REQUESTED',
              };
            }
            return repo;
          }),
        };
      }
      return repositories;
    }
    case 'REPOSITORY_UPDATE': {
      const repo = action.payload;
      if (repositories.repositories.find((r) => r.id === repo.id)) {
        return {
          ...repositories,
          repositories: repositories.repositories.map((r) => {
            if (r.id === repo.id) {
              return repo;
            }
            return r;
          }),
        };
      }
      return {
        ...repositories,
        repositories: [...repositories.repositories, repo],
      };
    }
  }
  return repositories;
};

export default reducer;
