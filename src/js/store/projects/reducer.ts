import { ObjectsAction, PaginatedObjectResponse } from '@/js/store/actions';
import { ProjectsAction } from '@/js/store/projects/actions';
import { LogoutAction } from '@/js/store/user/actions';
import { GitHubUser } from '@/js/store/user/reducer';
import { OBJECT_TYPES } from '@/js/utils/constants';

export interface OrgConfig {
  key: string;
  label?: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  old_slugs: string[];
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  description: string;
  description_rendered: string;
  is_managed: boolean;
  branch_prefix: string;
  github_users: GitHubUser[];
  github_issue_count: number;
  repo_image_url: string;
  org_config_names: OrgConfig[];
  currently_fetching_org_config_names: boolean;
  currently_fetching_github_users: boolean;
  currently_fetching_issues: boolean;
  latest_sha: string;
  has_push_permission: boolean;
  has_truncated_issues: boolean;
}
export interface ProjectsState {
  projects: Project[];
  next: string | null;
  notFound: string[];
  refreshing: boolean;
}

const defaultState = {
  projects: [],
  next: null,
  notFound: [],
  refreshing: false,
};

const reducer = (
  projects: ProjectsState = defaultState,
  action: ProjectsAction | ObjectsAction | LogoutAction,
): ProjectsState => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return { ...defaultState };
    case 'REFRESH_PROJECTS_REQUESTED':
    case 'REFRESHING_PROJECTS':
    case 'REFRESH_PROJECTS_REJECTED':
    case 'REFRESH_PROJECTS_ERROR': {
      return {
        ...projects,
        refreshing: [
          'REFRESH_PROJECTS_REQUESTED',
          'REFRESHING_PROJECTS',
        ].includes(action.type),
      };
    }
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const { response, objectType, reset } = action.payload;
      const { results, next } = response as PaginatedObjectResponse;
      if (objectType === OBJECT_TYPES.PROJECT) {
        if (reset) {
          return {
            ...projects,
            projects: results,
            next,
            refreshing: false,
          };
        }
        // Store list of known project IDs to filter out duplicates
        const ids = projects.projects.map((project) => project.id);
        return {
          ...projects,
          projects: [
            ...projects.projects,
            ...results.filter((project) => !ids.includes(project.id)),
          ],
          next,
          refreshing: false,
        };
      }
      return projects;
    }
    case 'FETCH_OBJECT_SUCCEEDED': {
      const {
        object,
        filters: { slug },
        objectType,
      } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT) {
        if (!object) {
          return {
            ...projects,
            notFound: [...projects.notFound, slug],
          };
        }
        if (!projects.projects.find((project) => project.id === object.id)) {
          return {
            ...projects,
            projects: [...projects.projects, object],
          };
        }
      }
      return projects;
    }
    case 'REFRESH_GH_USERS_REQUESTED':
    case 'REFRESH_GH_USERS_REJECTED': {
      const projectId = action.payload;
      if (projects.projects.find((project) => project.id === projectId)) {
        return {
          ...projects,
          projects: projects.projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                currently_fetching_github_users:
                  action.type === 'REFRESH_GH_USERS_REQUESTED',
              };
            }
            return project;
          }),
        };
      }
      return projects;
    }
    case 'REFRESH_ORG_CONFIGS_REQUESTED':
    case 'REFRESH_ORG_CONFIGS_REJECTED': {
      const projectId = action.payload;
      if (projects.projects.find((project) => project.id === projectId)) {
        return {
          ...projects,
          projects: projects.projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                currently_fetching_org_config_names:
                  action.type === 'REFRESH_ORG_CONFIGS_REQUESTED',
              };
            }
            return project;
          }),
        };
      }
      return projects;
    }
    case 'PROJECT_UPDATE': {
      const project = action.payload;
      if (projects.projects.find((r) => r.id === project.id)) {
        return {
          ...projects,
          projects: projects.projects.map((r) => {
            if (r.id === project.id) {
              return project;
            }
            return r;
          }),
        };
      }
      return {
        ...projects,
        projects: [...projects.projects, project],
      };
    }
  }
  return projects;
};

export default reducer;
