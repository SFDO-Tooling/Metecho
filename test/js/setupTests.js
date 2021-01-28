import '@testing-library/jest-dom/extend-expect';

import settings from '@salesforce/design-system-react/components/settings';
import fetchMock from 'fetch-mock';

beforeAll(() => {
  settings.setAppElement(document.documentElement);
  document.createRange = () => ({
    setStart: jest.fn(),
    setEnd: jest.fn(),
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
  });
  window.api_urls = {
    account_logout: () => '/accounts/logout/',
    github_login: () => '/accounts/github/login/',
    salesforce_login: () => '/accounts/salesforce/login/',
    user: () => '/api/user/',
    user_refresh: () => '/api/user/refresh/',
    user_disconnect_sf: () => '/api/user/disconnect/',
    agree_to_tos: () => '/api/agree_to_tos/',
    project_list: () => '/api/projects/',
    project_detail: (slug) => `/api/projects/${slug}/`,
    project_refresh_github_users: (id) =>
      `/api/projects/${id}/refresh_github_users/`,
    epic_list: () => '/api/epics/',
    scratch_org_list: () => '/api/scratch_orgs/',
    scratch_org_detail: (id) => `/api/scratch_orgs/${id}/`,
    scratch_org_commit: (id) => `/api/scratch_orgs/${id}/commit/`,
    scratch_org_redirect: (id) => `/api/scratch_orgs/${id}/redirect/`,
    scratch_org_refresh: (id) => `/api/scratch_orgs/${id}/refresh/`,
    task_detail: (id) => `/api/tasks/${id}/`,
    task_create_pr: (id) => `/api/tasks/${id}/create_pr/`,
    task_review: (id) => `/api/tasks/${id}/review/`,
    task_can_reassign: (id) => `/api/tasks/${id}/can_reassign/`,
    epic_detail: (id) => `/api/epics/${id}/`,
    epic_create_pr: (id) => `/api/epics/${id}/create_pr/`,
    epic_refresh_org_config_names: (id) =>
      `/api/epics/${id}/refresh_org_config_names/`,
    project_feature_branches: (id) => `/api/projects/${id}/feature_branches/`,
  };
  window.GLOBALS = {};
  window.open = jest.fn();
  window.console.error = jest.fn();
  window.console.warn = jest.fn();
  window.console.info = jest.fn();
});

afterEach(() => fetchMock.reset());
