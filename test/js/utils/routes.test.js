import routes, { routePatterns } from '@/utils/routes';

describe('routes', () => {
  test.each([
    ['home', [], '/'],
    ['login', [], '/login'],
    ['repository_list', [], '/repositories'],
    ['repository_detail', ['slug'], '/repositories/slug'],
    [
      'project_detail',
      ['repository-slug', 'project-slug'],
      '/repositories/repository-slug/project-slug',
    ],
    [
      'task_detail',
      ['repository-slug', 'project-slug', 'task-slug'],
      '/repositories/repository-slug/project-slug/task-slug',
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
    ['repository_list', '/repositories'],
    ['repository_detail', '/repositories/:repositorySlug'],
    ['project_detail', '/repositories/:repositorySlug/:projectSlug'],
    ['task_detail', '/repositories/:repositorySlug/:projectSlug/:taskSlug'],
  ])('%s returns path', (name, expected) => {
    expect(routePatterns[name]()).toBe(expected);
  });
});
