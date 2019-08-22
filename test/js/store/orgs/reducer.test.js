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
      org_type: 'Dev',
    };
    const expected = {};
    const actual = reducer(
      {
        'task-id': {
          Dev: org1,
          QA: null,
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
        org_type: 'Dev',
      };
      const org2 = {
        id: 'org-id-2',
        task: 'task-1',
        org_type: 'QA',
      };
      const badOrg = {
        id: 'this-should-not-happen',
        task: 'task-1',
        org_type: 'QA',
      };
      const expected = {
        'task-1': {
          Dev: org1,
          QA: org2,
        },
        'task-2': {
          Dev: null,
          QA: null,
        },
      };
      const actual = reducer(
        {
          'task-2': {
            Dev: null,
            QA: null,
          },
        },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: [org1, org2, badOrg],
            objectType: 'scratch_org',
            filters: { task: 'task-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores null if no org for task', () => {
      const expected = {
        'task-1': {
          Dev: null,
          QA: null,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: [],
            objectType: 'scratch_org',
            filters: { task: 'task-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "scratch_org"', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
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
        org_type: 'Dev',
      };
      const expected = {
        'task-1': {
          Dev: org,
          QA: null,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: org,
            objectType: 'scratch_org',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "scratch_org"', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
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

  describe('SCRATCH_ORG_PROVISIONED', () => {
    test('adds org to task', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const expected = {
        'task-1': {
          Dev: org,
          QA: null,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'SCRATCH_ORG_PROVISIONED',
          payload: org,
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('SCRATCH_ORG_PROVISION_FAILED', () => {
    test('removes org from task', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const expected = {
        'task-1': {
          Dev: null,
          QA: null,
        },
      };
      const actual = reducer(
        {
          'task-1': {
            Dev: org,
            QA: null,
          },
        },
        {
          type: 'SCRATCH_ORG_PROVISION_FAILED',
          payload: org,
        },
      );

      expect(actual).toEqual(expected);
    });

    test('does not error if org not found', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const expected = {
        'task-1': {
          Dev: null,
          QA: null,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'SCRATCH_ORG_PROVISION_FAILED',
          payload: org,
        },
      );

      expect(actual).toEqual(expected);
    });
  });
});
