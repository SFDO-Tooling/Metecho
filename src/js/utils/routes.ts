/* eslint-disable @typescript-eslint/camelcase */

const routes = {
  home: () => '/',
  login: () => '/login',
  repository_list: () => '/repositories',
  repository_detail: (repositorySlug: string) =>
    `/repositories/${repositorySlug}`,
  project_detail: (repositorySlug: string, projectSlug: string) =>
    `/repositories/${repositorySlug}/${projectSlug}`,
  task_detail: (
    repositorySlug: string,
    projectSlug: string,
    taskSlug: string,
  ) => `/repositories/${repositorySlug}/${projectSlug}/${taskSlug}`,
};

export const routePatterns = {
  home: () => '/',
  login: () => '/login',
  auth_error: () => '/accounts/*',
  repository_list: () => '/repositories',
  repository_detail: () => '/repositories/:repositorySlug',
  project_detail: () => '/repositories/:repositorySlug/:projectSlug',
  task_detail: () => '/repositories/:repositorySlug/:projectSlug/:taskSlug',
};

export default routes;
