import reducer from '@/store/tasks/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const task1 = {
      id: 't1',
      slug: 'task-1',
      name: 'Task 1',
      description: 'This is a test task.',
      project: 'p1',
    };
    const expected = {};
    const actual = reducer(
      {
        p1: [task1],
      },
      { type: 'USER_LOGGED_OUT' },
    );

    expect(actual).toEqual(expected);
  });

  describe('FETCH_OBJECTS_SUCCEEDED', () => {
    test('resets task list for project', () => {
      const task1 = {
        id: 't1',
        slug: 'task-1',
        name: 'Task 1',
        description: 'This is a test task.',
        project: 'project-1',
      };
      const task2 = {
        id: 't2',
        slug: 'task-2',
        name: 'Task 2',
        description: 'This is another test task.',
        project: 'project-1',
      };
      const expected = {
        'project-1': [task2],
        'project-2': [],
      };
      const actual = reducer(
        {
          'project-1': [task1],
          'project-2': [],
        },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: [task2],
            objectType: 'task',
            filters: { project: 'project-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "task"', () => {
      const task = {
        id: 'p1',
        slug: 'task-1',
        name: 'Task 1',
        project: 'project-1',
      };
      const expected = {};
      const actual = reducer(expected, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: [task],
          objectType: 'other-object',
          filters: { project: 'project-1' },
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('CREATE_OBJECT_SUCCEEDED', () => {
    test('adds task to list', () => {
      const task1 = {
        id: 'p1',
        slug: 'task-1',
        name: 'Task 1',
        project: 'project-1',
      };
      const expected = {
        'project-1': [task1],
      };
      const actual = reducer(
        {},
        {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: task1,
            objectType: 'task',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('does not add duplicate task', () => {
      const task1 = {
        id: 'p1',
        slug: 'task-1',
        name: 'Task 1',
        project: 'project-1',
      };
      const expected = {
        'project-1': [task1],
      };
      const actual = reducer(expected, {
        type: 'CREATE_OBJECT_SUCCEEDED',
        payload: {
          object: task1,
          objectType: 'task',
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "task"', () => {
      const task = {
        id: 'p1',
        slug: 'task-1',
        name: 'Task 1',
        project: 'project-1',
      };
      const expected = {};
      const actual = reducer(expected, {
        type: 'CREATE_OBJECT_SUCCEEDED',
        payload: {
          object: task,
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(expected);
    });
  });
});
