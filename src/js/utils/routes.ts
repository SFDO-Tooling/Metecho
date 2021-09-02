const routes = {
  home: () => '/',
  login: () => '/login',
  terms: () => '/terms',
  project_list: () => '/projects',
  project_detail: (projectSlug: string) => `/projects/${projectSlug}`,
  epic_detail: (projectSlug: string, epicSlug: string) =>
    `/projects/${projectSlug}/epics/${epicSlug}`,
  project_task_detail: (projectSlug: string, taskSlug: string) =>
    `/projects/${projectSlug}/tasks/${taskSlug}`,
  epic_task_detail: (projectSlug: string, epicSlug: string, taskSlug: string) =>
    `/projects/${projectSlug}/epics/${epicSlug}/tasks/${taskSlug}`,
};

export const routePatterns = {
  home: '/',
  login: '/login',
  terms: '/terms',
  auth_error: '/accounts/*',
  project_list: '/projects',
  project_detail: '/projects/:projectSlug',
  epic_detail: '/projects/:projectSlug/epics/:epicSlug',
  project_task_detail: '/projects/:projectSlug/tasks/:taskSlug',
  epic_task_detail: '/projects/:projectSlug/epics/:epicSlug/tasks/:taskSlug',
  old_epic_detail: '/projects/:projectSlug/:epicSlug',
  old_task_detail: '/projects/:projectSlug/:epicSlug/:taskSlug',
};

export default routes;
