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
    describe('OBJECT_TYPES.ORG', () => {
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

      test('ignores if no object', () => {
        const actual = reducer(
          {},
          {
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              objectType: 'scratch_org',
            },
          },
        );

        expect(actual).toEqual({});
      });
    });

    describe('OBJECT_TYPES.COMMIT', () => {
      test('sets committing: true', () => {
        const commit = {
          id: 'commit-id',
          task: 'task-1',
        };
        const expected = {
          'task-1': {
            Dev: null,
            QA: null,
            changeset: undefined,
            committing: true,
          },
        };
        const actual = reducer(
          {},
          {
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              object: commit,
              objectType: 'scratch_org_commit',
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
              objectType: 'scratch_org_commit',
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

  describe('REFETCH_ORG_STARTED', () => {
    test('sets currently_refreshing_changes: true', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
        currently_refreshing_changes: false,
      };
      const expected = {
        'task-1': {
          Dev: { ...org, currently_refreshing_changes: true },
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
          type: 'REFETCH_ORG_STARTED',
          payload: { org },
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('REFETCH_ORG_FAILED', () => {
    test('sets currently_refreshing_changes: false', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
        currently_refreshing_changes: true,
      };
      const expected = {
        'task-1': {
          Dev: { ...org, currently_refreshing_changes: false },
          QA: null,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'REFETCH_ORG_FAILED',
          payload: { org },
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('DELETE_OBJECT_SUCCEEDED', () => {
    test('adds deletion_queued_at to org', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const actual = reducer(
        {},
        {
          type: 'DELETE_OBJECT_SUCCEEDED',
          payload: {
            object: org,
            objectType: 'scratch_org',
          },
        },
      );

      expect(actual['task-1'].Dev.deletion_queued_at).not.toBe(undefined);
    });

    test('ignores if objectType !== "scratch_org"', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const expected = {};
      const actual = reducer(expected, {
        type: 'DELETE_OBJECT_SUCCEEDED',
        payload: {
          object: org,
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('REQUEST_CHANGESET_STARTED', () => {
    test('removes changeset from task', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const expected = {
        'task-1': {
          Dev: org,
          QA: null,
          changeset: undefined,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'REQUEST_CHANGESET_STARTED',
          payload: { org },
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('REQUEST_CHANGESET_SUCCEEDED', () => {
    test('sets fetchingChangeset: true', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const expected = {
        'task-1': {
          Dev: org,
          QA: null,
          fetchingChangeset: true,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'REQUEST_CHANGESET_SUCCEEDED',
          payload: { org },
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('CHANGESET_SUCCEEDED', () => {
    test('stores changeset and sets fetchingChangeset: false', () => {
      const changeset = {
        id: 'changeset-id',
        task: 'task-1',
      };
      const expected = {
        'task-1': {
          Dev: null,
          QA: null,
          changeset,
          fetchingChangeset: false,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'CHANGESET_SUCCEEDED',
          payload: changeset,
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('CHANGESET_FAILED/CHANGESET_CANCELED', () => {
    test('removes changeset and sets fetchingChangeset: false', () => {
      const changeset = {
        id: 'changeset-id',
        task: 'task-1',
      };
      const expected = {
        'task-1': {
          Dev: null,
          QA: null,
          changeset: undefined,
          fetchingChangeset: false,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'CHANGESET_FAILED',
          payload: changeset,
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('COMMIT_FAILED/COMMIT_SUCCEEDED', () => {
    test('sets committing: false', () => {
      const commit = {
        id: 'commit-id',
        task: 'task-1',
      };
      const expected = {
        'task-1': {
          Dev: null,
          QA: null,
          committing: false,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'COMMIT_FAILED',
          payload: commit,
        },
      );

      expect(actual).toEqual(expected);
    });
  });
});
