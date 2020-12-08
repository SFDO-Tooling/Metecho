const routes = {
  home: () => '/',
  login: () => '/login',
  terms: () => '/terms',
  repository_list: () => '/repositories',
  repository_detail: (repositorySlug: string) =>
    `/repositories/${repositorySlug}`,
  epic_detail: (repositorySlug: string, epicSlug: string) =>
    `/repositories/${repositorySlug}/${epicSlug}`,
  task_detail: (repositorySlug: string, epicSlug: string, taskSlug: string) =>
    `/repositories/${repositorySlug}/${epicSlug}/${taskSlug}`,
};

/* istanbul ignore next */
export const routePatterns = {
  home: () => '/',
  login: () => '/login',
  terms: () => '/terms',
  auth_error: () => '/accounts/*',
  repository_list: () => '/repositories',
  repository_detail: () => '/repositories/:repositorySlug',
  epic_detail: () => '/repositories/:repositorySlug/:epicSlug',
  task_detail: () => '/repositories/:repositorySlug/:epicSlug/:taskSlug',
};

export default routes;
