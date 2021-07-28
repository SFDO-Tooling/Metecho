import routes, { routePatterns } from '@/js/utils/routes';

describe('routes', () => {
  test.each([
    ['home', [], '/'],
    ['login', [], '/login'],
    ['project_list', [], '/projects'],
    ['project_detail', ['slug'], '/projects/slug'],
    [
      'epic_detail',
      ['project-slug', 'epic-slug'],
      '/projects/project-slug/epic-slug',
    ],
    [
      'task_detail',
      ['project-slug', 'epic-slug', 'task-slug'],
      '/projects/project-slug/epic-slug/task-slug',
    ],
  ])('%s returns path with args: %o', (name, args, expected) => {
    expect(routes[name](...args)).toBe(expected);
  });
});

describe('routePatterns', () => {
  test.each([
    ['home', '/'],
    ['login', '/login'],
    ['auth_error', '/accounts/*'],
    ['project_list', '/projects'],
    ['project_detail', '/projects/:projectSlug'],
    ['epic_detail', '/projects/:projectSlug/:epicSlug'],
    ['task_detail', '/projects/:projectSlug/:epicSlug/:taskSlug'],
  ])('%s returns path', (name, expected) => {
    expect(routePatterns[name]()).toBe(expected);
  });
});
