/* eslint-disable @typescript-eslint/camelcase */

import { ObjectsAction, PaginatedObjectResponse } from '@/store/actions';
import { ProjectAction } from '@/store/projects/actions';
import { GitHubUser } from '@/store/repositories/reducer';
import { LogoutAction, RefetchDataAction } from '@/store/user/actions';
import { OBJECT_TYPES, ObjectTypes } from '@/utils/constants';

export interface Project {
  id: string;
  repository: string;
  name: string;
  slug: string;
  old_slugs: string[];
  description: string;
  branch_url: string | null;
  branch_diff_url: string | null;
  pr_url: string | null;
  pr_is_open: boolean;
  has_unmerged_commits: boolean;
  currently_creating_pr: boolean;
  github_users: GitHubUser[];
}
export interface ProjectsByRepositoryState {
  projects: Project[];
  next: string | null;
  notFound: string[];
  fetched: boolean;
}

export interface ProjectsState {
  [key: string]: ProjectsByRepositoryState;
}

const defaultState = {
  projects: [],
  next: null,
  notFound: [],
  fetched: false,
};

const reducer = (
  projects: ProjectsState = {},
  action: ProjectAction | ObjectsAction | LogoutAction | RefetchDataAction,
) => {
  switch (action.type) {
    case 'REFETCH_DATA_SUCCEEDED':
    case 'USER_LOGGED_OUT':
      return {};
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const {
        response,
        objectType,
        reset,
        filters: { repository },
      } = action.payload;
      const { results, next } = response as PaginatedObjectResponse;
      if (objectType === OBJECT_TYPES.PROJECT && repository) {
        const repositoryProjects = projects[repository] || { ...defaultState };
        if (reset) {
          return {
            ...projects,
            [repository]: {
              ...repositoryProjects,
              projects: results,
              next,
              fetched: true,
            },
          };
        }
        // Store list of known project IDs to filter out duplicates
        const ids = repositoryProjects.projects.map((p) => p.id);
        return {
          ...projects,
          [repository]: {
            ...repositoryProjects,
            projects: [
              ...repositoryProjects.projects,
              ...results.filter((p) => !ids.includes(p.id)),
            ],
            next,
            fetched: true,
          },
        };
      }
      return projects;
    }
    case 'CREATE_OBJECT_SUCCEEDED': {
      const {
        object,
        objectType,
      }: { object: Project; objectType: ObjectTypes } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT && object) {
        const repository = projects[object.repository] || { ...defaultState };
        // Do not store if (somehow) we already know about this project
        if (!repository.projects.filter((p) => object.id === p.id).length) {
          return {
            ...projects,
            [object.repository]: {
              ...repository,
              // Prepend new project (projects are ordered by `-created_at`)
              projects: [object, ...repository.projects],
            },
          };
        }
      }
      return projects;
    }
    case 'FETCH_OBJECT_SUCCEEDED': {
      const {
        object,
        filters: { repository, slug },
        objectType,
      } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT && repository) {
        const repositoryProjects = projects[repository] || { ...defaultState };
        if (!object) {
          return {
            ...projects,
            [repository]: {
              ...repositoryProjects,
              notFound: [...repositoryProjects.notFound, slug],
            },
          };
        }
        // Do not store if we already know about this project
        if (
          !repositoryProjects.projects.filter((p) => object.id === p.id).length
        ) {
          return {
            ...projects,
            [object.repository]: {
              ...repositoryProjects,
              projects: [...repositoryProjects.projects, object],
            },
          };
        }
      }
      return projects;
    }
    case 'PROJECT_UPDATE':
    case 'UPDATE_OBJECT_SUCCEEDED': {
      let maybeProject;
      if (action.type === 'PROJECT_UPDATE') {
        maybeProject = action.payload;
      } else if (action.type === 'UPDATE_OBJECT_SUCCEEDED') {
        const {
          object,
          objectType,
        }: { object: Project; objectType: ObjectTypes } = action.payload;
        if (objectType === OBJECT_TYPES.PROJECT && object) {
          maybeProject = object;
        }
      }
      if (!maybeProject) {
        return projects;
      }
      const project = maybeProject;
      const repositoryProjects = projects[project.repository] || {
        ...defaultState,
      };
      const existingProject = repositoryProjects.projects.find(
        (p) => p.id === project.id,
      );
      if (existingProject) {
        return {
          ...projects,
          [project.repository]: {
            ...repositoryProjects,
            projects: repositoryProjects.projects.map((p) => {
              if (p.id === project.id) {
                return { ...project };
              }
              return p;
            }),
          },
        };
      }
      return {
        ...projects,
        [project.repository]: {
          ...repositoryProjects,
          projects: [...repositoryProjects.projects, project],
        },
      };
    }
    case 'PROJECT_CREATE_PR_FAILED': {
      const project = action.payload;
      const repositoryProjects = projects[project.repository] || {
        ...defaultState,
      };
      const existingProject = repositoryProjects.projects.find(
        (p) => p.id === project.id,
      );
      if (existingProject) {
        return {
          ...projects,
          [project.repository]: {
            ...repositoryProjects,
            projects: repositoryProjects.projects.map((p) => {
              if (p.id === project.id) {
                return { ...project, currently_creating_pr: false };
              }
              return p;
            }),
          },
        };
      }
      return projects;
    }
  }
  return projects;
};

export default reducer;
