import '@testing-library/jest-dom/extend-expect';

import fetchMock from 'fetch-mock';

beforeAll(() => {
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
    salesforce_custom_login: () => '/accounts/salesforce-custom/login/',
    salesforce_production_login: () => '/accounts/salesforce-production/login/',
    user: () => '/api/user/',
    user_refresh: () => '/api/user/refresh/',
    user_disconnect_sf: () => '/api/user/disconnect/',
    repository_list: () => '/api/repositories/',
    repository_detail: (slug) => `/api/repositories/${slug}/`,
    repository_refresh_github_users: (id) =>
      `/api/repositories/${id}/refresh_github_users/`,
    project_list: () => '/api/projects/',
    scratch_org_list: () => '/api/scratch_orgs/',
    scratch_org_detail: (id) => `/api/scratch_orgs/${id}/`,
    scratch_org_commit: (id) => `/api/scratch_orgs/${id}/commit/`,
    scratch_org_redirect: (id) => `/api/scratch_orgs/${id}/redirect/`,
    task_detail: (id) => `/api/tasks/${id}/`,
    task_create_pr: (id) => `/api/tasks/${id}/create_pr/`,
    project_detail: (id) => `/api/projects/${id}/`,
    project_create_pr: (id) => `/api/projects/${id}/create_pr/`,
  };
  window.GLOBALS = {};
  window.console.error = jest.fn();
  window.console.warn = jest.fn();
  window.console.info = jest.fn();
});

afterEach(fetchMock.reset);
