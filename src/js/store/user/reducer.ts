import {
  ProjectsRefreshed,
  ProjectsRefreshError,
} from '@/js/store/projects/actions';
import { UserAction } from '@/js/store/user/actions';

export interface GitHubUser {
  id: string;
  login: string;
  avatar_url: string;
  name?: string;
  permissions?: {
    pull: boolean;
    push: boolean;
    admin: boolean;
  };
}

export interface GitHubOrg {
  id: string;
  name: string;
  avatar_url: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  github_id: string | null;
  valid_token_for: string | null;
  sf_username: string | null;
  org_name: string | null;
  org_type: string | null;
  is_devhub_enabled: boolean;
  is_staff: boolean;
  currently_fetching_repos: boolean;
  currently_fetching_orgs: boolean;
  devhub_username: string;
  uses_global_devhub: boolean;
  agreed_to_tos_at: string | null;
  onboarded_at: string | null;
  self_guided_tour_enabled: boolean;
  self_guided_tour_state: string[] | null;
  organizations: GitHubOrg[];
}

const reducer = (
  user: User | null = null,
  action: UserAction | ProjectsRefreshed | ProjectsRefreshError,
): User | null => {
  switch (action.type) {
    case 'USER_LOGGED_IN':
    case 'USER_DISCONNECT_SUCCEEDED':
    case 'USER_REFRESH_SUCCEEDED':
    case 'AGREE_TO_TERMS_SUCCEEDED':
    case 'ONBOARDING_SUCCEEDED':
    case 'TOUR_UPDATE_SUCCEEDED':
      return action.payload;
    case 'USER_LOGGED_OUT':
      return null;
    case 'PROJECTS_REFRESHED':
    case 'REFRESH_PROJECTS_ERROR':
      return user ? { ...user, currently_fetching_repos: false } : user;
    case 'REFRESH_ORGS_REQUESTED':
    case 'REFRESHING_ORGS':
      return user ? { ...user, currently_fetching_orgs: true } : user;
    case 'REFRESH_ORGS_REJECTED':
    case 'REFRESH_ORGS_ERROR':
      return user ? { ...user, currently_fetching_orgs: false } : user;
  }
  return user;
};

export default reducer;
