import routes from '@/js/utils/routes';

describe('routes', () => {
  test.each([
    ['home', [], '/'],
    ['login', [], '/login'],
    ['project_list', [], '/projects'],
    ['project_detail', ['slug'], '/projects/slug'],
    [
      'epic_detail',
      ['project-slug', 'epic-slug'],
      '/projects/project-slug/epics/epic-slug',
    ],
    [
      'project_task_detail',
      ['project-slug', 'task-slug'],
      '/projects/project-slug/tasks/task-slug',
    ],
    [
      'epic_task_detail',
      ['project-slug', 'epic-slug', 'task-slug'],
      '/projects/project-slug/epics/epic-slug/tasks/task-slug',
    ],
  ])('%s returns path with args: %o', (name, args, expected) => {
    expect(routes[name](...args)).toBe(expected);
  });
});
