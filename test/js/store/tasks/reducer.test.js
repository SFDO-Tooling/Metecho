import reducer from '@/store/tasks/reducer';

describe('reducer', () => {
  test('returns initial state if no action', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test.each([['USER_LOGGED_OUT'], ['REFETCH_DATA_SUCCEEDED']])(
    'returns initial state on %s action',
    (action) => {
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
        id: 't1',
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
    describe('OBJECT_TYPES.TASK', () => {
      test('adds task to list', () => {
        const task = {
          id: 't1',
          slug: 'task-1',
          name: 'Task 1',
          project: 'project-1',
        };
        const expected = {
          'project-1': [task],
        };
        const actual = reducer(
          {},
          {
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              object: task,
              objectType: 'task',
            },
          },
        );

        expect(actual).toEqual(expected);
      });

      test('does not add duplicate task', () => {
        const task = {
          id: 't1',
          slug: 'task-1',
          name: 'Task 1',
          project: 'project-1',
        };
        const expected = {
          'project-1': [task],
        };
        const actual = reducer(expected, {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: task,
            objectType: 'task',
          },
        });

        expect(actual).toEqual(expected);
      });

      test('ignores if no object', () => {
        const actual = reducer(
          {},
          {
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              objectType: 'task',
            },
          },
        );

        expect(actual).toEqual({});
      });
    });

    describe('OBJECT_TYPES.TASK_PR', () => {
      test('sets currently_creating_pr: true', () => {
        const task = {
          id: 't1',
          slug: 'task-1',
          name: 'Task 1',
          project: 'project-1',
          currently_creating_pr: false,
        };
        const task2 = {
          id: 't2',
          project: 'project-1',
        };
        const expected = {
          'project-1': [{ ...task, currently_creating_pr: true }, task2],
        };
        const actual = reducer(
          { 'project-1': [task, task2] },
          {
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              object: task,
              objectType: 'task_pr',
            },
          },
        );

        expect(actual).toEqual(expected);
      });

      test('adds task to list if no existing task', () => {
        const task = {
          id: 't1',
          slug: 'task-1',
          name: 'Task 1',
          project: 'project-1',
          currently_creating_pr: false,
        };
        const expected = {
          'project-1': [{ ...task, currently_creating_pr: true }],
        };
        const actual = reducer(
          {},
          {
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              object: task,
              objectType: 'task_pr',
            },
          },
        );

        expect(actual).toEqual(expected);
      });

      test('ignores if no object', () => {
        const actual = reducer(
          {},
          {
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              objectType: 'task_pr',
            },
          },
        );

        expect(actual).toEqual({});
      });
    });

    test('ignores if objectType unknown', () => {
      const actual = reducer(
        {},
        {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: {},
            objectType: 'other-object',
          },
        },
      );

      expect(actual).toEqual({});
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

  describe('UPDATE_OBJECT_SUCCEEDED', () => {
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
          type: 'UPDATE_OBJECT_SUCCEEDED',
          payload: { object: editedTask, objectType: 'task' },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if unknown objectType', () => {
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
        'project-1': [task, task2],
      };
      const actual = reducer(
        {
          'project-1': [task, task2],
        },
        {
          type: 'UPDATE_OBJECT_SUCCEEDED',
          payload: { object: editedTask, objectType: 'foobar' },
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('TASK_CREATE_PR_FAILED', () => {
    test('sets currently_creating_pr: false', () => {
      const task = {
        id: 't1',
        slug: 'task-1',
        name: 'Task 1',
        project: 'project-1',
        currently_creating_pr: true,
      };
      const task2 = {
        id: 't2',
        project: 'project-1',
      };
      const expected = {
        'project-1': [{ ...task, currently_creating_pr: false }, task2],
      };
      const actual = reducer(
        { 'project-1': [task, task2] },
        {
          type: 'TASK_CREATE_PR_FAILED',
          payload: task,
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if no existing task', () => {
      const task = {
        id: 't1',
        slug: 'task-1',
        name: 'Task 1',
        project: 'project-1',
        currently_creating_pr: true,
      };
      const actual = reducer(
        {},
        {
          type: 'TASK_CREATE_PR_FAILED',
          payload: task,
        },
      );

      expect(actual).toEqual({});
    });
  });

  describe('DELETE_OBJECT_SUCCEEDED', () => {
    test('adds deleted_at to existing task', () => {
      const task = {
        id: 't1',
        project: 'project-1',
        name: 'Task Name',
      };
      const task2 = {
        id: 't2',
        project: 'project-1',
      };
      const actual = reducer(
        { 'project-1': [task, task2] },
        {
          type: 'DELETE_OBJECT_SUCCEEDED',
          payload: { object: task, objectType: 'task' },
        },
      );

      expect(actual['project-1'][0].deleted_at).not.toBeUndefined();
    });

    test('ignores if no existing task', () => {
      const task = {
        id: 't1',
        slug: 'task-1',
        name: 'Task 1',
        project: 'project-1',
      };
      const actual = reducer(
        {},
        {
          type: 'DELETE_OBJECT_SUCCEEDED',
          payload: { object: task, objectType: 'task' },
        },
      );

      expect(actual).toEqual({});
    });

    test('ignores if different objecttype', () => {
      const task = {
        id: 't1',
        project: 'project-1',
      };
      const task2 = {
        id: 't2',
        project: 'project-1',
      };
      const expected = {
        'project-1': [task, task2],
      };
      const actual = reducer(
        {
          'project-1': [task, task2],
        },
        {
          type: 'DELETE_OBJECT_SUCCEEDED',
          payload: { object: task2, objectType: 'foobar' },
        },
      );

      expect(actual).toEqual(expected);
    });
  });
});
