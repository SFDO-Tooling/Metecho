/* eslint-disable @typescript-eslint/camelcase */

import { ReposRefreshed } from '@/store/repositories/actions';
import { UserAction } from '@/store/user/actions';

export interface GitHubUser {
  id: string;
  login: string;
  avatar_url: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  valid_token_for: string | null;
  sf_username: string | null;
  org_name: string | null;
  org_type: string | null;
  is_devhub_enabled: boolean;
  is_staff: boolean;
  currently_fetching_repos: boolean;
  devhub_username: string | null;
}

const reducer = (
  user: User | null = null,
  action: UserAction | ReposRefreshed,
): User | null => {
  switch (action.type) {
    case 'USER_LOGGED_IN':
    case 'USER_DISCONNECT_SUCCEEDED':
    case 'DEV_HUB_STATUS_SUCCEEDED':
      return action.payload;
    case 'USER_LOGGED_OUT':
      return null;
    case 'REPOS_REFRESHED':
      return user ? { ...user, currently_fetching_repos: false } : user;
  }
  return user;
};

export default reducer;
