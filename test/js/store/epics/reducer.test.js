import reducer from '@/js/store/epics/reducer';

describe('reducer', () => {
  test('returns initial state if no action', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test.each([['USER_LOGGED_OUT'], ['REFETCH_DATA_SUCCEEDED']])(
    'returns initial state on %s action',
    (action) => {
      const epic1 = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        description: 'This is a test epic.',
        project: 'project-1',
      };
      const expected = {};
      const actual = reducer(
        {
          'project-1': {
            epics: [epic1],
            next: 'next-url',
            notFound: ['epic-2'],
          },
        },
        { type: action },
      );

      expect(actual).toEqual(expected);
    },
  );

  describe('FETCH_OBJECTS_SUCCEEDED', () => {
    test('resets epics list for project if `reset: true`', () => {
      const epic1 = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        description: 'This is a test epic.',
        project: 'project-1',
      };
      const epic2 = {
        id: 'p2',
        slug: 'epic-2',
        name: 'Epic 2',
        description: 'This is another test epic.',
        project: 'project-1',
      };
      const expected = {
        'project-1': {
          epics: [epic2],
          next: 'next-url',
          notFound: [],
          fetched: true,
        },
        'project-2': {
          epics: [],
          next: null,
          notFound: [],
          fetched: false,
        },
      };
      const actual = reducer(
        {
          'project-1': {
            epics: [epic1],
            next: null,
            notFound: [],
            fetched: false,
          },
          'project-2': {
            epics: [],
            next: null,
            notFound: [],
            fetched: false,
          },
        },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [epic2], next: 'next-url' },
            objectType: 'epic',
            reset: true,
            filters: { project: 'project-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('creates project-epic data if not already known', () => {
      const epic1 = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        description: 'This is a test epic.',
        project: 'project-1',
      };
      const expected = {
        'project-1': {
          epics: [epic1],
          next: 'next-url',
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [epic1], next: 'next-url' },
            objectType: 'epic',
            reset: true,
            filters: { project: 'project-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('adds to epics list if `reset: false`', () => {
      const epic1 = {
        id: 'epic1',
        slug: 'epic-1',
        name: 'Epic 1',
        project: 'project-1',
      };
      const mockEpics = {
        notFound: [],
        epics: [epic1],
        next: null,
        fetched: false,
      };
      const epic2 = {
        id: 'epic2',
        slug: 'epic-2',
        name: 'Epic 2',
        project: 'project-1',
      };
      const expected = {
        'project-1': {
          ...mockEpics,
          epics: [...mockEpics.epics, epic2],
          fetched: true,
        },
      };
      const actual = reducer(
        { 'project-1': mockEpics },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [epic1, epic2], next: null },
            objectType: 'epic',
            reset: false,
            filters: { project: 'project-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "epic"', () => {
      const epic = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        project: 'project-1',
      };
      const expected = {};
      const actual = reducer(expected, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: { results: [epic], next: null },
          objectType: 'other-object',
          reset: true,
          filters: { project: 'project-1' },
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('CREATE_OBJECT_SUCCEEDED', () => {
    test('adds epic to list', () => {
      const epic1 = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        description: 'This is a test epic.',
        project: 'project-1',
      };
      const expected = {
        'project-1': {
          epics: [epic1],
          next: null,
          notFound: [],
          fetched: false,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: epic1,
            objectType: 'epic',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('does not add duplicate epic', () => {
      const epic1 = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        description: 'This is a test epic.',
        project: 'project-1',
      };
      const expected = {
        'project-1': { epics: [epic1], next: null, notFound: [] },
      };
      const actual = reducer(
        {
          'project-1': { epics: [epic1], next: null, notFound: [] },
        },
        {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: epic1,
            objectType: 'epic',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "epic"', () => {
      const epic = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        project: 'project-1',
      };
      const expected = {};
      const actual = reducer(expected, {
        type: 'CREATE_OBJECT_SUCCEEDED',
        payload: {
          object: epic,
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('FETCH_OBJECT_SUCCEEDED', () => {
    test('adds epic', () => {
      const epic1 = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        project: 'project1',
      };
      const epic2 = {
        id: 'p2',
        slug: 'epic-2',
        name: 'Epic 2',
        project: 'project1',
      };
      const expected = {
        project1: {
          epics: [epic1, epic2],
          next: null,
          notFound: [],
        },
      };
      const actual = reducer(
        {
          project1: { epics: [epic1], next: null, notFound: [] },
        },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: epic2,
            filters: { project: 'project1', slug: 'epic-2' },
            objectType: 'epic',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores id of missing epic', () => {
      const expected = {
        project1: {
          epics: [],
          next: null,
          notFound: ['epic-2'],
          fetched: false,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: null,
            filters: { project: 'project1', slug: 'epic-2' },
            objectType: 'epic',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores duplicate epic', () => {
      const epic1 = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        project: 'project1',
      };
      const expected = {
        project1: { epics: [epic1], next: null, notFound: [] },
      };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: epic1,
          filters: { project: 'project1', slug: 'epic-1' },
          objectType: 'epic',
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "epic"', () => {
      const expected = {};
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

      expect(actual).toEqual(expected);
    });
  });

  describe('EPIC_UPDATE', () => {
    test('adds new epic to list', () => {
      const epic = {
        id: 'p1',
        project: 'project-1',
        name: 'Epic 1',
      };
      const expected = {
        'project-1': {
          epics: [epic],
          next: null,
          notFound: [],
          fetched: false,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'EPIC_UPDATE',
          payload: epic,
        },
      );

      expect(actual).toEqual(expected);
    });

    test('updates existing epic', () => {
      const epic = {
        id: 'p1',
        project: 'project-1',
        name: 'Epic 1',
      };
      const epic2 = {
        id: 'p2',
        project: 'project-1',
        name: 'Epic 2',
      };
      const editedEpic = { ...epic, name: 'Edited Epic Name' };
      const expected = {
        'project-1': {
          epics: [editedEpic, epic2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {
          'project-1': {
            epics: [epic, epic2],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
        {
          type: 'EPIC_UPDATE',
          payload: editedEpic,
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('UPDATE_OBJECT_SUCCEEDED', () => {
    test('updates existing epic', () => {
      const epic = {
        id: 'p1',
        project: 'project-1',
        name: 'Epic 1',
      };
      const epic2 = {
        id: 'p2',
        project: 'project-1',
        name: 'Epic 2',
      };
      const editedEpic = { ...epic, name: 'Edited Epic Name' };
      const expected = {
        'project-1': {
          epics: [editedEpic, epic2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {
          'project-1': {
            epics: [epic, epic2],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
        {
          type: 'UPDATE_OBJECT_SUCCEEDED',
          payload: {
            objectType: 'epic',
            object: editedEpic,
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if unknown objectType', () => {
      const epic = {
        id: 'p1',
        project: 'project-1',
        name: 'Epic 1',
      };
      const epic2 = {
        id: 'p2',
        project: 'project-1',
        name: 'Epic 2',
      };
      const editedEpic = { ...epic, name: 'Edited Epic Name' };
      const expected = {
        'project-1': {
          epics: [epic, epic2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {
          'project-1': {
            epics: [epic, epic2],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
        {
          type: 'UPDATE_OBJECT_SUCCEEDED',
          payload: {
            objectType: 'foobar',
            object: editedEpic,
          },
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('EPIC_CREATE_PR_FAILED', () => {
    test('sets currently_creating_pr: false', () => {
      const epic = {
        id: 'p1',
        project: 'project-1',
        name: 'Epic 1',
        currently_creating_pr: true,
      };
      const epic2 = {
        id: 'p2',
        project: 'project-1',
        name: 'Epic 2',
      };
      const editedEpic = { ...epic, currently_creating_pr: false };
      const expected = {
        'project-1': {
          epics: [editedEpic, epic2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {
          'project-1': {
            epics: [epic, epic2],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
        {
          type: 'EPIC_CREATE_PR_FAILED',
          payload: epic,
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if no existing epic', () => {
      const epic = {
        id: 'p1',
        project: 'project-1',
        name: 'Epic 1',
        currently_creating_pr: true,
      };
      const actual = reducer(
        {},
        {
          type: 'EPIC_CREATE_PR_FAILED',
          payload: epic,
        },
      );

      expect(actual).toEqual({});
    });
  });

  describe('DELETE_OBJECT_SUCCEEDED', () => {
    test('removes epic', () => {
      const epic = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        description: 'This is a test epic.',
        project: 'project-1',
      };
      const epic2 = {
        id: 'p2',
        project: 'project-1',
        name: 'Epic 2',
      };
      const initial = {
        'project-1': {
          epics: [epic, epic2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const expected = [epic2];
      const actual = reducer(initial, {
        type: 'DELETE_OBJECT_SUCCEEDED',
        payload: {
          object: epic,
          objectType: 'epic',
        },
      });

      expect(actual['project-1'].epics).toEqual(expected);
    });

    test('ignores if unknown objectType', () => {
      const epic = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        description: 'This is a test epic.',
        project: 'project-1',
      };
      const epic2 = {
        id: 'p2',
        project: 'project-1',
        name: 'Epic 2',
      };
      const initial = {
        'project-1': {
          epics: [epic, epic2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(initial, {
        type: 'DELETE_OBJECT_SUCCEEDED',
        payload: {
          object: epic,
          objectType: 'foobar',
        },
      });

      expect(actual).toEqual(initial);
    });
  });

  describe('OBJECT_REMOVED', () => {
    test('removes epic', () => {
      const epic = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        description: 'This is a test epic.',
        project: 'project-1',
      };
      const epic2 = {
        id: 'p2',
        project: 'project-1',
        name: 'Epic 2',
      };
      const initial = {
        'project-1': {
          epics: [epic, epic2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const expected = [epic2];
      const actual = reducer(initial, {
        type: 'OBJECT_REMOVED',
        payload: epic,
      });

      expect(actual['project-1'].epics).toEqual(expected);
    });

    test('ignores if payload is not an epic', () => {
      const epic = {
        id: 'r1',
        slug: 'epic-1',
        name: 'Epic 1',
        description: 'This is a test epic.',
        project: 'project-1',
      };
      const epic2 = {
        id: 'p2',
        project: 'project-1',
        name: 'Epic 2',
      };
      const initial = {
        'project-1': {
          epics: [epic, epic2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(initial, {
        type: 'OBJECT_REMOVED',
        payload: {},
      });

      expect(actual).toEqual(initial);
    });
  });
});
