import reducer from '@/js/store/tasks/reducer';

const epic = {
  id: 'epic-1',
  name: 'My Epic',
  slug: 'epic-1',
  github_users: [],
};

const epic2 = {
  id: 'epic-2',
  name: 'My Other Epic',
  slug: 'epic-2',
  github_users: [],
};

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
        epic,
      };
      const expected = {};
      const actual = reducer(
        {
          p1: { tasks: [task1] },
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
        epic,
      };
      const task2 = {
        id: 't2',
        slug: 'task-2',
        name: 'Task 2',
        description: 'This is another test task.',
        epic2,
      };
      const expected = {
        p1: {
          tasks: [task1, task2],
          fetched: true,
          notFound: [],
        },
      };
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: [task1, task2],
            objectType: 'task',
            filters: { project: 'p1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('adds to task list for epic', () => {
      const task1 = {
        id: 't1',
        slug: 'task-1',
        name: 'Task 1',
        description: 'This is a test task.',
        epic,
      };
      const task2 = {
        id: 't2',
        slug: 'task-2',
        name: 'Task 2',
        description: 'This is another test task.',
        epic2,
      };
      const expected = {
        p1: {
          tasks: [task2, task1],
          fetched: ['epic-1', 'epic-2'],
        },
        p2: {
          tasks: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {
          p1: {
            tasks: [task1],
            fetched: ['epic-1'],
          },
          p2: {
            tasks: [],
            fetched: true,
          },
        },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: [task2],
            objectType: 'task',
            filters: { project: 'p1', epic: 'epic-2' },
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
        epic,
      };
      const expected = {};
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: [task],
            objectType: 'other-object',
            filters: { epic: 'epic-1' },
          },
        },
      );

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
          epic,
          root_project: 'p1',
        };
        const expected = {
          p1: { tasks: [task], fetched: [], notFound: [] },
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
          epic,
          root_project: 'p1',
        };
        const expected = {
          p1: { tasks: [task], fetched: [], notFound: [] },
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
          epic,
          currently_creating_pr: false,
          root_project: 'p1',
        };
        const task2 = {
          id: 't2',
          epic,
          root_project: 'p1',
        };
        const expected = {
          p1: {
            tasks: [{ ...task, currently_creating_pr: true }, task2],
            fetched: [],
            notFound: [],
          },
        };
        const actual = reducer(
          { p1: { tasks: [task, task2], fetched: [], notFound: [] } },
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
          epic,
          currently_creating_pr: false,
          root_project: 'p1',
        };
        const expected = {
          p1: {
            tasks: [{ ...task, currently_creating_pr: true }],
            fetched: [],
            notFound: [],
          },
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

  describe('FETCH_OBJECT_SUCCEEDED', () => {
    test('adds epic', () => {
      const task = {
        id: 't1',
        slug: 'task-1',
        epic,
        root_project: 'p1',
      };
      const task2 = {
        id: 't2',
        slug: 'task-2',
        epic,
        root_project: 'p1',
      };
      const expected = {
        p1: {
          tasks: [task2, task],
        },
      };
      const actual = reducer(
        {
          p1: { tasks: [task] },
        },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: task2,
            filters: { project: 'p1', epic: epic.slug, slug: task2.slug },
            objectType: 'task',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores id of missing task [with epic]', () => {
      const expected = {
        p1: {
          tasks: [],
          fetched: [],
          notFound: ['missing-epic-missing-task'],
        },
      };
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: null,
            filters: {
              project: 'p1',
              epic: 'missing-epic',
              slug: 'missing-task',
            },
            objectType: 'task',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores id of missing task [no epic]', () => {
      const expected = {
        p1: {
          tasks: [],
          fetched: [],
          notFound: ['missing-task'],
        },
      };
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: null,
            filters: {
              project: 'p1',
              slug: 'missing-task',
            },
            objectType: 'task',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('updates existing task', () => {
      const task = {
        id: 't1',
        slug: 'task-1',
        name: 'Task 1',
        epic,
        root_project: 'p1',
      };
      const editedTask = {
        ...task,
        name: 'Task 1 -- Edited',
      };
      const task2 = {
        id: 't2',
        slug: 'task-2',
        epic,
        root_project: 'p1',
      };
      const expected = {
        p1: { tasks: [editedTask, task2] },
      };
      const actual = reducer(
        {
          p1: { tasks: [task, task2] },
        },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: editedTask,
            filters: { project: 'p1', slug: editedTask.slug },
            objectType: 'task',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "task"', () => {
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            objectType: 'project',
            filters: {},
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
        epic,
        root_project: 'p1',
      };
      const expected = {
        p1: { tasks: [task], fetched: [], notFound: [] },
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
        epic,
        name: 'Task Name',
        root_project: 'p1',
      };
      const task2 = {
        id: 't2',
        epic,
        root_project: 'p1',
      };
      const editedTask = { ...task, name: 'Edited Task Name' };
      const expected = {
        p1: { tasks: [editedTask, task2], fetched: [], notFound: [] },
      };
      const actual = reducer(
        {
          p1: { tasks: [task, task2], fetched: [], notFound: [] },
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
        epic,
        name: 'Task Name',
        root_project: 'p1',
      };
      const task2 = {
        id: 't2',
        epic,
        root_project: 'p1',
      };
      const editedTask = { ...task, name: 'Edited Task Name' };
      const expected = {
        p1: { tasks: [editedTask, task2], fetched: [], notFound: [] },
      };
      const actual = reducer(
        {
          p1: { tasks: [task, task2], fetched: [], notFound: [] },
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
        epic,
        name: 'Task Name',
        root_project: 'p1',
      };
      const task2 = {
        id: 't2',
        epic,
        root_project: 'p1',
      };
      const editedTask = { ...task, name: 'Edited Task Name' };
      const expected = {
        p1: { tasks: [task, task2], fetched: [], notFound: [] },
      };
      const actual = reducer(
        {
          p1: { tasks: [task, task2], fetched: [], notFound: [] },
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
        epic,
        currently_creating_pr: true,
        root_project: 'p1',
      };
      const task2 = {
        id: 't2',
        epic,
        root_project: 'p1',
      };
      const expected = {
        p1: {
          tasks: [{ ...task, currently_creating_pr: false }, task2],
          fetched: [],
          notFound: [],
        },
      };
      const actual = reducer(
        { p1: { tasks: [task, task2], fetched: [], notFound: [] } },
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
        epic,
        currently_creating_pr: true,
        root_project: 'p1',
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
    test('removes task', () => {
      const task = {
        id: 't1',
        epic,
        name: 'Task Name',
        root_project: 'p1',
      };
      const task2 = {
        id: 't2',
        epic,
        root_project: 'p1',
      };
      const actual = reducer(
        { p1: { tasks: [task, task2], fetched: [], notFound: [] } },
        {
          type: 'DELETE_OBJECT_SUCCEEDED',
          payload: { object: task, objectType: 'task' },
        },
      );

      expect(actual.p1.tasks).toEqual([task2]);
    });

    test('ignores if unknown objectType', () => {
      const task = {
        id: 't1',
        epic,
        name: 'Task Name',
        root_project: 'p1',
      };
      const task2 = {
        id: 't2',
        epic,
        root_project: 'p1',
      };
      const initial = {
        p1: { tasks: [task, task2], fetched: [], notFound: [] },
      };
      const actual = reducer(initial, {
        type: 'DELETE_OBJECT_SUCCEEDED',
        payload: { object: task, objectType: 'foobar' },
      });

      expect(actual).toEqual(initial);
    });
  });

  describe('OBJECT_REMOVED', () => {
    test('removes task', () => {
      const task = {
        id: 't1',
        epic,
        name: 'Task Name',
        root_project: 'p1',
      };
      const task2 = {
        id: 't2',
        epic,
        root_project: 'p1',
      };
      const actual = reducer(
        { p1: { tasks: [task, task2], fetched: [], notFound: [] } },
        {
          type: 'OBJECT_REMOVED',
          payload: task,
        },
      );

      expect(actual.p1.tasks).toEqual([task2]);
    });

    test('ignores if payload is not a task', () => {
      const task = {
        id: 't1',
        epic,
        name: 'Task Name',
        root_project: 'p1',
      };
      const task2 = {
        id: 't2',
        epic,
        root_project: 'p1',
      };
      const initial = {
        p1: { tasks: [task, task2], fetched: [], notFound: [] },
      };
      const actual = reducer(initial, {
        type: 'OBJECT_REMOVED',
        payload: {},
      });

      expect(actual).toEqual(initial);
    });
  });
});
