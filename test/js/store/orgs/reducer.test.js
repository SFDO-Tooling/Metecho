import reducer from '@/store/orgs/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const org1 = {
      id: 'org-id',
      task: 'task-id',
      type: 'dev',
    };
    const expected = {};
    const actual = reducer(
      {
        'task-id': {
          dev: org1,
          qa: null,
        },
      },
      { type: 'USER_LOGGED_OUT' },
    );

    expect(actual).toEqual(expected);
  });

  describe('FETCH_OBJECTS_SUCCEEDED', () => {
    test('resets orgs for task', () => {
      const org1 = {
        id: 'org-id',
        task: 'task-1',
        type: 'dev',
      };
      const org2 = {
        id: 'org-id-2',
        task: 'task-1',
        type: 'qa',
      };
      const badOrg = {
        id: 'this-should-not-happen',
        task: 'task-1',
        type: 'qa',
      };
      const expected = {
        'task-1': {
          dev: org1,
          qa: org2,
        },
        'task-2': {
          dev: null,
          qa: null,
        },
      };
      const actual = reducer(
        {
          'task-2': {
            dev: null,
            qa: null,
          },
        },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: [org1, org2, badOrg],
            objectType: 'org',
            filters: { task: 'task-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores null if no org for task', () => {
      const expected = {
        'task-1': {
          dev: null,
          qa: null,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: [],
            objectType: 'org',
            filters: { task: 'task-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "org"', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        type: 'dev',
      };
      const expected = {};
      const actual = reducer(expected, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: [org],
          objectType: 'other-object',
          filters: { task: 'task-1' },
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('CREATE_OBJECT_SUCCEEDED', () => {
    test('adds org to task', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        type: 'dev',
      };
      const expected = {
        'task-1': {
          dev: org,
          qa: null,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: org,
            objectType: 'org',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "org"', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        type: 'dev',
      };
      const expected = {};
      const actual = reducer(expected, {
        type: 'CREATE_OBJECT_SUCCEEDED',
        payload: {
          object: org,
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(expected);
    });
  });
});
