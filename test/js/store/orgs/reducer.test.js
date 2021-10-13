import reducer, { defaultState } from '@/js/store/orgs/reducer';

describe('reducer', () => {
  test('returns initial state if no action', () => {
    const actual = reducer(undefined, {});

    expect(actual).toEqual(defaultState);
  });

  test.each([['USER_LOGGED_OUT'], ['REFETCH_DATA_SUCCEEDED']])(
    'returns initial state on %s action',
    (action) => {
      const org1 = {
        id: 'org-id',
        task: 'task-id',
        org_type: 'Dev',
      };
      const actual = reducer(
        {
          ...defaultState,
          orgs: {
            [org1.id]: org1,
          },
        },
        { type: action },
      );

      expect(actual).toEqual(defaultState);
    },
  );

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
      const org3 = {
        id: 'org-id-3',
        task: 'task-1',
        org_type: 'Playground',
      };
      const expected = {
        ...defaultState,
        orgs: {
          [org1.id]: org1,
          [org2.id]: org2,
          [org3.id]: org3,
        },
        fetched: {
          ...defaultState.fetched,
          tasks: ['task-1'],
        },
      };
      const actual = reducer(defaultState, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: [org1, org2, org3],
          objectType: 'scratch_org',
          filters: { task: 'task-1' },
        },
      });

      expect(actual).toEqual(expected);
    });

    test('resets orgs for epic', () => {
      const org = {
        id: 'org-id',
        epic: 'epic-1',
        org_type: 'Playground',
      };
      const expected = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
        fetched: {
          ...defaultState.fetched,
          epics: ['epic-1'],
        },
      };
      const actual = reducer(defaultState, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: [org],
          objectType: 'scratch_org',
          filters: { epic: 'epic-1' },
        },
      });

      expect(actual).toEqual(expected);
    });

    test('resets orgs for project', () => {
      const org = {
        id: 'org-id',
        project: 'project-1',
        org_type: 'Playground',
      };
      const expected = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
        fetched: {
          ...defaultState.fetched,
          projects: ['project-1'],
        },
      };
      const actual = reducer(defaultState, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: [org],
          objectType: 'scratch_org',
          filters: { project: 'project-1' },
        },
      });

      expect(actual).toEqual(expected);
    });

    test('does not store if no org for task', () => {
      const expected = {
        ...defaultState,
        fetched: {
          ...defaultState.fetched,
          tasks: ['task-1'],
        },
      };
      const actual = reducer(defaultState, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: [],
          objectType: 'scratch_org',
          filters: { task: 'task-1' },
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "scratch_org"', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const actual = reducer(defaultState, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: [org],
          objectType: 'other-object',
          filters: { task: 'task-1' },
        },
      });

      expect(actual).toEqual(defaultState);
    });

    test('ignores if no org filter', () => {
      const org = {
        id: 'org-id',
        epic: 'epic-1',
        org_type: 'Playground',
      };
      const actual = reducer(defaultState, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: [org],
          objectType: 'other-object',
          filters: {},
        },
      });

      expect(actual).toEqual(defaultState);
    });

    test('does not duplicate id in "fetched" lists', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const initial = {
        ...defaultState,
        fetched: {
          ...defaultState.fetched,
          tasks: ['task-1'],
        },
      };
      const expected = {
        ...initial,
        orgs: {
          [org.id]: org,
        },
      };
      const actual = reducer(initial, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: [org],
          objectType: 'scratch_org',
          filters: { task: 'task-1' },
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('CREATE_OBJECT_SUCCEEDED', () => {
    describe('OBJECT_TYPES.ORG', () => {
      test('adds org', () => {
        const org = {
          id: 'org-id',
          task: 'task-1',
          org_type: 'Dev',
        };
        const expected = {
          ...defaultState,
          orgs: {
            [org.id]: org,
          },
        };
        const actual = reducer(defaultState, {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: org,
            objectType: 'scratch_org',
          },
        });

        expect(actual).toEqual(expected);
      });

      test('ignores if no object', () => {
        const actual = reducer(defaultState, {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            objectType: 'scratch_org',
          },
        });

        expect(actual).toEqual(defaultState);
      });
    });

    describe('OBJECT_TYPES.COMMIT', () => {
      test('sets currently_capturing_changes: true', () => {
        const org = {
          id: 'org-id',
          task: 'task-1',
          org_type: 'Dev',
          currently_capturing_changes: true,
        };
        const expected = {
          ...defaultState,
          orgs: {
            [org.id]: org,
          },
        };
        const actual = reducer(defaultState, {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: org,
            objectType: 'scratch_org_commit',
          },
        });

        expect(actual).toEqual(expected);
      });

      test('ignores if no object', () => {
        const actual = reducer(defaultState, {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            objectType: 'scratch_org_commit',
          },
        });

        expect(actual).toEqual(defaultState);
      });
    });

    test('ignores if objectType unknown', () => {
      const actual = reducer(defaultState, {
        type: 'CREATE_OBJECT_SUCCEEDED',
        payload: {
          object: {},
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(defaultState);
    });
  });

  describe('SCRATCH_ORG_PROVISION', () => {
    test('adds org', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const expected = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
      };
      const actual = reducer(defaultState, {
        type: 'SCRATCH_ORG_PROVISION',
        payload: org,
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('SCRATCH_ORG_PROVISIONING', () => {
    test('adds org', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const expected = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
      };
      const actual = reducer(defaultState, {
        type: 'SCRATCH_ORG_PROVISIONING',
        payload: org,
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('SCRATCH_ORG_PROVISION_FAILED', () => {
    test('removes org', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const initial = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
      };
      const actual = reducer(initial, {
        type: 'SCRATCH_ORG_PROVISION_FAILED',
        payload: org,
      });

      expect(actual).toEqual(defaultState);
    });

    test('does not error if org not found', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const actual = reducer(defaultState, {
        type: 'SCRATCH_ORG_PROVISION_FAILED',
        payload: org,
      });

      expect(actual).toEqual(defaultState);
    });
  });

  describe('UPDATE_OBJECT_SUCCEEDED', () => {
    test('updates org', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
        has_unsaved_changes: false,
      };
      const changedOrg = { ...org, has_unsaved_changes: true };
      const expected = {
        ...defaultState,
        orgs: {
          [changedOrg.id]: changedOrg,
        },
      };
      const initial = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
      };
      const actual = reducer(initial, {
        type: 'UPDATE_OBJECT_SUCCEEDED',
        payload: {
          objectType: 'scratch_org',
          object: changedOrg,
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if unknown objectType', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
        has_unsaved_changes: false,
      };
      const changedOrg = { ...org, has_unsaved_changes: true };
      const initial = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
      };
      const actual = reducer(initial, {
        type: 'UPDATE_OBJECT_SUCCEEDED',
        payload: {
          objectType: 'foobar',
          object: changedOrg,
        },
      });

      expect(actual).toEqual(initial);
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
      const initial = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
      };
      const changedOrg = { ...org, currently_refreshing_changes: true };
      const expected = {
        ...defaultState,
        orgs: {
          [changedOrg.id]: changedOrg,
        },
      };
      const actual = reducer(initial, {
        type: 'REFETCH_ORG_STARTED',
        payload: { org },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('REFETCH_ORG_SUCCEEDED', () => {
    test('updates org with response', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
        currently_refreshing_changes: false,
      };
      const expected = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
      };
      const actual = reducer(defaultState, {
        type: 'REFETCH_ORG_SUCCEEDED',
        payload: { org },
      });

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
      const initial = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
      };
      const changedOrg = { ...org, currently_refreshing_changes: false };
      const expected = {
        ...defaultState,
        orgs: {
          [changedOrg.id]: changedOrg,
        },
      };
      const actual = reducer(initial, {
        type: 'REFETCH_ORG_FAILED',
        payload: { org },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('DELETE_OBJECT_SUCCEEDED', () => {
    test('adds delete_queued_at to org', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const actual = reducer(defaultState, {
        type: 'DELETE_OBJECT_SUCCEEDED',
        payload: {
          object: org,
          objectType: 'scratch_org',
        },
      });

      expect(actual.orgs[org.id].delete_queued_at).toBeDefined();
    });

    test('ignores if objectType !== "scratch_org"', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
      };
      const actual = reducer(defaultState, {
        type: 'DELETE_OBJECT_SUCCEEDED',
        payload: {
          object: org,
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(defaultState);
    });
  });

  describe('SCRATCH_ORG_COMMIT_CHANGES_FAILED/SCRATCH_ORG_COMMIT_CHANGES', () => {
    test('updates org', () => {
      const org = {
        id: 'org-id',
        task: 'task-1',
        org_type: 'Dev',
        currently_capturing_changes: false,
      };
      const expected = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
      };
      const actual = reducer(defaultState, {
        type: 'SCRATCH_ORG_COMMIT_CHANGES_FAILED',
        payload: org,
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('SCRATCH_ORG_REFRESH_REQUESTED', () => {
    const org = {
      id: 'org-1',
      task: 'task-1',
      org_type: 'QA',
    };
    const org2 = {
      id: 'org-2',
      task: 'task-1',
      org_type: 'Dev',
    };
    const initial = {
      ...defaultState,
      orgs: {
        [org.id]: org,
        [org2.id]: org2,
      },
    };

    test('sets currently_refreshing_org: true', () => {
      const changedOrg = { ...org, currently_refreshing_org: true };
      const expected = {
        ...initial,
        orgs: {
          ...initial.orgs,
          [org.id]: changedOrg,
        },
      };
      const actual = reducer(initial, {
        type: 'SCRATCH_ORG_REFRESH_REQUESTED',
        payload: org,
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('SCRATCH_ORG_REFRESH_REJECTED', () => {
    test('sets currently_refreshing_org: false', () => {
      const org = {
        id: 'org-1',
        task: 'task-1',
        org_type: 'QA',
        currently_refreshing_org: false,
      };
      const expected = {
        ...defaultState,
        orgs: {
          [org.id]: org,
        },
      };
      const actual = reducer(defaultState, {
        type: 'SCRATCH_ORG_REFRESH_REJECTED',
        payload: org,
      });

      expect(actual).toEqual(expected);
    });
  });
});
