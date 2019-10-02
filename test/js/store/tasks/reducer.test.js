import reducer from '@/store/tasks/reducer';

describe('reducer', () => {
  test('returns initial state if no action', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test.each([['USER_LOGGED_OUT'], ['REFETCH_DATA_SUCCEEDED']])(
    'returns initial state on %s action',
    action => {
      const task1 = {
        id: 't1',
        slug: 'task-1',
        name: 'Task 1',
        description: 'This is a test task.',
        project: 'r1',
      };
      const expected = {};
      const actual = reducer(
        {
          r1: [task1],
        },
        { type: action },
      );

      expect(actual).toEqual(expected);
    },
  );

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
        id: 'r1',
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
        id: 'r1',
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
        id: 'r1',
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
        id: 'r1',
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

  describe('TASK_UPDATE', () => {
    test('adds new task to list', () => {
      const task = {
        id: 't1',
        project: 'project-1',
      };
      const expected = {
        'project-1': [task],
      };
      const actual = reducer(
        {},
        {
          type: 'TASK_UPDATE',
          payload: task,
        },
      );

      expect(actual).toEqual(expected);
    });

    test('updates existing task', () => {
      const task = {
        id: 't1',
        project: 'project-1',
        name: 'Task Name',
      };
      const task2 = {
        id: 't2',
        project: 'project-1',
      };
      const editedTask = { ...task, name: 'Edited Task Name' };
      const expected = {
        'project-1': [editedTask, task2],
      };
      const actual = reducer(
        {
          'project-1': [task, task2],
        },
        {
          type: 'TASK_UPDATE',
          payload: editedTask,
        },
      );

      expect(actual).toEqual(expected);
    });
  });
});
