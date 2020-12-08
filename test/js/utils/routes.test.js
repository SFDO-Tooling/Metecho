import routes, { routePatterns } from '@/utils/routes';

describe('routes', () => {
  test.each([
    ['home', [], '/'],
    ['login', [], '/login'],
    ['repository_list', [], '/repositories'],
    ['repository_detail', ['slug'], '/repositories/slug'],
    [
      'epic_detail',
      ['repository-slug', 'epic-slug'],
      '/repositories/repository-slug/epic-slug',
    ],
    [
      'task_detail',
      ['repository-slug', 'epic-slug', 'task-slug'],
      '/repositories/repository-slug/epic-slug/task-slug',
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
    ['epic_detail', '/repositories/:repositorySlug/:epicSlug'],
    ['task_detail', '/repositories/:repositorySlug/:epicSlug/:taskSlug'],
  ])('%s returns path', (name, expected) => {
    expect(routePatterns[name]()).toBe(expected);
  });
});
