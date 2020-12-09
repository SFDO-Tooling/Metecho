const routes = {
  home: () => '/',
  login: () => '/login',
  terms: () => '/terms',
  project_list: () => '/projects',
  project_detail: (projectSlug: string) => `/projects/${projectSlug}`,
  epic_detail: (projectSlug: string, epicSlug: string) =>
    `/projects/${projectSlug}/${epicSlug}`,
  task_detail: (projectSlug: string, epicSlug: string, taskSlug: string) =>
    `/projects/${projectSlug}/${epicSlug}/${taskSlug}`,
};

/* istanbul ignore next */
export const routePatterns = {
  home: () => '/',
  login: () => '/login',
  terms: () => '/terms',
  auth_error: () => '/accounts/*',
  project_list: () => '/projects',
  project_detail: () => '/projects/:projectSlug',
  epic_detail: () => '/projects/:projectSlug/:epicSlug',
  task_detail: () => '/projects/:projectSlug/:epicSlug/:taskSlug',
};

export default routes;
