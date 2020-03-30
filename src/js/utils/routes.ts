const routes = {
  home: () => '/',
  login: () => '/login',
  terms: () => '/terms',
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

/* istanbul ignore next */
export const routePatterns = {
  home: () => '/',
  login: () => '/login',
  terms: () => '/terms',
  auth_error: () => '/accounts/*',
  repository_list: () => '/repositories',
  repository_detail: () => '/repositories/:repositorySlug',
  project_detail: () => '/repositories/:repositorySlug/:projectSlug',
  task_detail: () => '/repositories/:repositorySlug/:projectSlug/:taskSlug',
};

export default routes;
