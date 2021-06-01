import fetchMock from 'fetch-mock';

import * as actions from '~js/store/orgs/actions';
import { addUrlParams } from '~js/utils/api';

import { getStoreWithHistory, storeWithThunk } from './../../utils';

const defaultState = {
  user: { id: 'user-id' },
  tasks: {
    'epic-id': [{ id: 'task-id', name: 'My Task', epic: 'epic-id' }],
  },
  epics: {
    'project-id': {
      epics: [{ id: 'epic-id', name: 'My Epic', project: 'project-id' }],
    },
  },
  projects: {
    projects: [{ id: 'project-id', name: 'My Project' }],
  },
};

describe('provisionOrg', () => {
  const org = {
    id: 'org-id',
    owner: 'user-id',
    url: '/test/url/',
    is_created: true,
    org_type: 'Dev',
    task: 'task-id',
  };
  const orgAction = {
    type: 'SCRATCH_ORG_PROVISION',
    payload: org,
  };

  test('triggers action', () => {
    const store = storeWithThunk(defaultState);
    store.dispatch(
      actions.provisionOrg({
        model: org,
        orginating_user_id: 'another-user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('SCRATCH_ORG_PROVISION');
    expect(allActions[0]).toEqual(orgAction);
  });

  describe('owned by current user', () => {
    test('adds success message [task org]', () => {
      const store = storeWithThunk(defaultState);
      store.dispatch(
        actions.provisionOrg({
          model: org,
          originating_user_id: 'user-id',
        }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toMatch(
        'Successfully created scratch org for Task “My Task”.',
      );
      expect(allActions[0].payload.linkText).toEqual('View your new org.');
      expect(allActions[0].payload.linkUrl).toEqual(
        window.api_urls.scratch_org_redirect(org.id),
      );
      expect(allActions[1]).toEqual(orgAction);
    });

    test('adds success message [epic org]', () => {
      const store = storeWithThunk(defaultState);
      const thisOrg = {
        ...org,
        org_type: 'Playground',
        task: undefined,
        epic: 'epic-id',
      };
      store.dispatch(
        actions.provisionOrg({
          model: thisOrg,
          originating_user_id: 'user-id',
        }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toMatch(
        'Successfully created scratch org for Epic “My Epic”.',
      );
      expect(allActions[0].payload.linkText).toEqual('View your new org.');
      expect(allActions[0].payload.linkUrl).toEqual(
        window.api_urls.scratch_org_redirect(thisOrg.id),
      );
      expect(allActions[1]).toEqual({
        type: 'SCRATCH_ORG_PROVISION',
        payload: thisOrg,
      });
    });

    test('adds success message [missing epic org parent]', () => {
      const store = storeWithThunk(defaultState);
      const thisOrg = {
        ...org,
        org_type: 'Playground',
        task: undefined,
        epic: 'other-epic-id',
      };
      store.dispatch(
        actions.provisionOrg({
          model: thisOrg,
          originating_user_id: 'user-id',
        }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toMatch(
        'Successfully created scratch org.',
      );
      expect(allActions[0].payload.linkText).toEqual('View your new org.');
      expect(allActions[0].payload.linkUrl).toEqual(
        window.api_urls.scratch_org_redirect(thisOrg.id),
      );
      expect(allActions[1]).toEqual({
        type: 'SCRATCH_ORG_PROVISION',
        payload: thisOrg,
      });
    });

    test('adds success message [project org]', () => {
      const store = storeWithThunk(defaultState);
      const thisOrg = {
        ...org,
        org_type: 'Playground',
        task: undefined,
        project: 'project-id',
      };
      store.dispatch(
        actions.provisionOrg({
          model: thisOrg,
          originating_user_id: 'user-id',
        }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toMatch(
        'Successfully created scratch org for Project “My Project”.',
      );
      expect(allActions[0].payload.linkText).toEqual('View your new org.');
      expect(allActions[0].payload.linkUrl).toEqual(
        window.api_urls.scratch_org_redirect(thisOrg.id),
      );
      expect(allActions[1]).toEqual({
        type: 'SCRATCH_ORG_PROVISION',
        payload: thisOrg,
      });
    });
  });

  test('does not fail if not yet created', () => {
    const store = storeWithThunk({ ...defaultState, tasks: {} });
    const thisOrg = { ...org, is_created: false };
    const thisOrgAction = { ...orgAction, payload: thisOrg };
    store.dispatch(
      actions.provisionOrg({
        model: thisOrg,
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully created scratch org.',
    );
    expect(allActions[0].payload.linkText).toBeUndefined();
    expect(allActions[0].payload.linkUrl).toBeUndefined();
    expect(allActions[1]).toEqual(thisOrgAction);
  });
});

describe('provisionFailed', () => {
  test('returns action', () => {
    const store = storeWithThunk({ ...defaultState, user: null, tasks: {} });
    const org = { id: 'org-id' };
    const action = { type: 'SCRATCH_ORG_PROVISION_FAILED', payload: org };
    store.dispatch(
      actions.provisionFailed({ model: org, message: 'error msg' }),
    );

    expect(store.getActions()).toEqual([action]);
  });

  describe('owned by current user', () => {
    test('adds error message', () => {
      const store = storeWithThunk(defaultState);
      const org = {
        id: 'org-id',
        owner: 'user-id',
        url: '/test/url/',
        is_created: true,
        org_type: 'Dev',
        task: 'task-id',
      };
      const orgAction = {
        type: 'SCRATCH_ORG_PROVISION_FAILED',
        payload: org,
      };
      store.dispatch(
        actions.provisionFailed({
          model: org,
          message: 'error msg',
          originating_user_id: 'user-id',
        }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toMatch(
        'Uh oh. There was an error creating your new scratch org for Task “My Task”.',
      );
      expect(allActions[0].payload.details).toEqual('error msg');
      expect(allActions[0].payload.variant).toEqual('error');
      expect(allActions[1]).toEqual(orgAction);
    });

    test('does not fail if missing url', () => {
      const store = storeWithThunk({ ...defaultState, tasks: {} });
      const org = {
        id: 'org-id',
        owner: 'user-id',
        org_type: 'Dev',
        task: 'task-id',
      };
      const orgAction = {
        type: 'SCRATCH_ORG_PROVISION_FAILED',
        payload: org,
      };
      store.dispatch(
        actions.provisionFailed({
          model: org,
          message: 'error msg',
          originating_user_id: 'user-id',
        }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Uh oh. There was an error creating your new scratch org.',
      );
      expect(allActions[0].payload.linkText).toBeUndefined();
      expect(allActions[0].payload.linkUrl).toBeUndefined();
      expect(allActions[1]).toEqual(orgAction);
    });
  });
});

describe('refetchOrg', () => {
  let url, payload;

  beforeAll(() => {
    url = addUrlParams(window.api_urls.scratch_org_detail('org-id'), {
      get_unsaved_changes: true,
    });
    const org = {
      id: 'org-id',
    };
    payload = { org, url: window.api_urls.scratch_org_detail('org-id') };
  });

  test('GETs org from api', () => {
    const store = storeWithThunk({ ...defaultState, user: null, tasks: {} });
    fetchMock.getOnce(url, payload.org);
    const started = {
      type: 'REFETCH_ORG_STARTED',
      payload,
    };
    const succeeded = {
      type: 'REFETCH_ORG_SUCCEEDED',
      payload,
    };

    expect.assertions(1);
    return store.dispatch(actions.refetchOrg(payload.org)).then(() => {
      expect(store.getActions()).toEqual([started, succeeded]);
    });
  });

  test('handles null response', () => {
    const store = storeWithThunk({ ...defaultState, user: null, tasks: {} });
    fetchMock.getOnce(url, 404);
    const started = {
      type: 'REFETCH_ORG_STARTED',
      payload,
    };
    const succeeded = {
      type: 'REFETCH_ORG_FAILED',
      payload: { ...payload, response: null },
    };

    expect.assertions(1);
    return store.dispatch(actions.refetchOrg(payload.org)).then(() => {
      expect(store.getActions()).toEqual([started, succeeded]);
    });
  });

  describe('error', () => {
    test('dispatches REFETCH_ORG_FAILED action', async () => {
      const store = storeWithThunk({ ...defaultState, user: null, tasks: {} });
      fetchMock.getOnce(url, 500);
      const started = {
        type: 'REFETCH_ORG_STARTED',
        payload,
      };
      const failed = {
        type: 'REFETCH_ORG_FAILED',
        payload,
      };

      expect.assertions(3);
      try {
        await store.dispatch(actions.refetchOrg(payload.org));
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('updateOrg', () => {
  test('returns SCRATCH_ORG_UPDATE action', () => {
    const org = { id: 'org-id' };
    const expected = { type: 'SCRATCH_ORG_UPDATE', payload: org };

    expect(actions.updateOrg(org)).toEqual(expected);
  });
});

describe('updateFailed', () => {
  test('adds error message', () => {
    const store = storeWithThunk(defaultState);
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_UPDATE',
      payload: org,
    };
    store.dispatch(
      actions.updateFailed({
        model: org,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Uh oh. There was an error checking for changes on your scratch org for Task “My Task”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });

  test('adds error message (no task)', () => {
    const store = storeWithThunk({ ...defaultState, tasks: {} });
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_UPDATE',
      payload: org,
    };
    store.dispatch(
      actions.updateFailed({
        model: org,
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error checking for changes on your scratch org.',
    );
    expect(allActions[0].payload.details).toBeUndefined();
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });
});

describe('deleteOrg', () => {
  beforeEach(() => {
    window.socket = { unsubscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('unsubscribes from socket and returns action', () => {
    const store = storeWithThunk({ ...defaultState, user: null, tasks: {} });
    const org = { id: 'org-id' };
    const action = { type: 'SCRATCH_ORG_DELETE', payload: org };
    store.dispatch(
      actions.deleteOrg({ model: org, originating_user_id: 'user-id' }),
    );
    expect(store.getActions()).toEqual([action]);
    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org',
      id: 'org-id',
    });
  });

  describe('owned by current user', () => {
    test('adds success message', () => {
      const store = storeWithThunk(defaultState);
      const org = {
        id: 'org-id',
        owner: 'user-id',
        url: '/test/url/',
        is_created: true,
        org_type: 'Dev',
        task: 'task-id',
      };
      const orgAction = { type: 'SCRATCH_ORG_DELETE', payload: org };
      store.dispatch(
        actions.deleteOrg({
          model: org,
          originating_user_id: 'user-id',
        }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toMatch(
        'Successfully deleted scratch org for Task “My Task”.',
      );
      expect(allActions[1]).toEqual(orgAction);
    });

    test('adds error message if exists', () => {
      const store = storeWithThunk(defaultState);
      const org = {
        id: 'org-id',
        owner: 'user-id',
        url: '/test/url/',
        is_created: true,
        org_type: 'Dev',
        task: 'task-id',
      };
      const orgAction = { type: 'SCRATCH_ORG_DELETE', payload: org };
      store.dispatch(
        actions.deleteOrg({
          model: org,
          message: 'Broke the widget.',
          originating_user_id: 'user-id',
        }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Uh oh. There was an error communicating with your scratch org.',
      );
      expect(allActions[1]).toEqual(orgAction);
    });
  });
});

describe('deleteFailed', () => {
  describe('owned by current user', () => {
    test('adds error message', () => {
      const store = storeWithThunk(defaultState);
      const org = {
        id: 'org-id',
        owner: 'user-id',
        org_type: 'Dev',
        task: 'task-id',
      };
      const orgAction = {
        type: 'SCRATCH_ORG_DELETE_FAILED',
        payload: org,
      };
      store.dispatch(
        actions.deleteFailed({
          model: org,
          message: 'error msg',
          originating_user_id: 'user-id',
        }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toMatch(
        'Uh oh. There was an error deleting your scratch org for Task “My Task”.',
      );
      expect(allActions[0].payload.details).toEqual('error msg');
      expect(allActions[0].payload.variant).toEqual('error');
      expect(allActions[1]).toEqual(orgAction);
    });
  });
});

describe('commitSucceeded', () => {
  test('adds success message', () => {
    const store = storeWithThunk(defaultState);
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_COMMIT_CHANGES',
      payload: org,
    };
    store.dispatch(
      actions.commitSucceeded({ model: org, originating_user_id: 'user-id' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Successfully retrieved changes from your scratch org for Task “My Task”.',
    );
    expect(allActions[1]).toEqual(action);
  });

  test('adds success message [no known task]', () => {
    const store = storeWithThunk({
      ...defaultState,
      tasks: {},
    });
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_COMMIT_CHANGES',
      payload: org,
    };
    store.dispatch(
      actions.commitSucceeded({ model: org, originating_user_id: 'user-id' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully retrieved changes from your scratch org.',
    );
    expect(allActions[1]).toEqual(action);
  });
});

describe('commitFailed', () => {
  test('adds error message', () => {
    const store = storeWithThunk(defaultState);
    const org = {
      id: 'commit-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_COMMIT_CHANGES_FAILED',
      payload: org,
    };
    store.dispatch(
      actions.commitFailed({
        model: org,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Uh oh. There was an error retrieving changes from your scratch org for Task “My Task”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });

  test('adds error message [no known task]', () => {
    const store = storeWithThunk({
      ...defaultState,
      tasks: {},
    });
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_COMMIT_CHANGES_FAILED',
      payload: org,
    };
    store.dispatch(
      actions.commitFailed({
        model: org,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error retrieving changes from your scratch org.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });
});

describe('refreshOrg', () => {
  const org = {
    id: 'org-id',
  };
  let url;

  beforeAll(() => {
    url = window.api_urls.scratch_org_refresh(org.id);
  });

  test('dispatches refreshOrg actions', () => {
    const store = storeWithThunk({ ...defaultState, user: null, tasks: {} });
    fetchMock.postOnce(url, 202);
    const refreshOrgRequested = {
      type: 'SCRATCH_ORG_REFRESH_REQUESTED',
      payload: org,
    };
    const refreshOrgAccepted = {
      type: 'SCRATCH_ORG_REFRESH_ACCEPTED',
      payload: org,
    };

    expect.assertions(1);
    return store.dispatch(actions.refreshOrg(org)).then(() => {
      expect(store.getActions()).toEqual([
        refreshOrgRequested,
        refreshOrgAccepted,
      ]);
    });
  });

  describe('error', () => {
    test('dispatches SCRATCH_ORG_REFRESH_REJECTED action', async () => {
      const store = storeWithThunk({ ...defaultState, user: null, tasks: {} });
      fetchMock.postOnce(url, {
        status: 500,
        body: { non_field_errors: ['Foobar'] },
      });
      const started = {
        type: 'SCRATCH_ORG_REFRESH_REQUESTED',
        payload: org,
      };
      const failed = {
        type: 'SCRATCH_ORG_REFRESH_REJECTED',
        payload: org,
      };

      expect.assertions(4);
      try {
        await store.dispatch(actions.refreshOrg(org));
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual(['Foobar']);
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('orgRefreshed', () => {
  test('adds success message', () => {
    const store = storeWithThunk(defaultState);
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_UPDATE',
      payload: org,
    };
    store.dispatch(
      actions.orgRefreshed({ model: org, originating_user_id: 'user-id' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Successfully refreshed your scratch org for Task “My Task”.',
    );
    expect(allActions[1]).toEqual(action);
  });

  test('adds success message [no known task]', () => {
    const store = storeWithThunk({
      ...defaultState,
      tasks: {},
    });
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_UPDATE',
      payload: org,
    };
    store.dispatch(
      actions.orgRefreshed({ model: org, originating_user_id: 'user-id' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully refreshed your scratch org.',
    );
    expect(allActions[1]).toEqual(action);
  });
});

describe('refreshError', () => {
  test('adds error message', () => {
    const store = storeWithThunk(defaultState);
    const org = {
      id: 'commit-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_UPDATE',
      payload: org,
    };
    store.dispatch(
      actions.refreshError({
        model: org,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Uh oh. There was an error refreshing your scratch org for Task “My Task”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });

  test('adds error message [no known task]', () => {
    const store = storeWithThunk({
      ...defaultState,
      tasks: {},
    });
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_UPDATE',
      payload: org,
    };
    store.dispatch(
      actions.refreshError({
        model: org,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error refreshing your scratch org.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });

  test('does not update if no full model', () => {
    const store = storeWithThunk({
      ...defaultState,
      tasks: {},
    });
    const org = {
      id: 'org-id',
      task: 'task-id',
    };
    store.dispatch(
      actions.refreshError({
        model: org,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions.map((action) => action.type)).toEqual([
      'TOAST_ADDED',
      'SCRATCH_ORG_REFRESH_REJECTED',
    ]);
  });
});

describe('recreateOrg', () => {
  beforeEach(() => {
    window.socket = { subscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('subscribes to socket and returns action', () => {
    const store = storeWithThunk({ ...defaultState, user: null, tasks: {} });
    const org = { id: 'org-id' };
    const action = { type: 'SCRATCH_ORG_RECREATE', payload: org };
    store.dispatch(actions.recreateOrg(org));
    expect(store.getActions()).toEqual([action]);
    expect(window.socket.subscribe).toHaveBeenCalledWith({
      model: 'scratch_org',
      id: 'org-id',
    });
  });
});

describe('orgReassigned', () => {
  test('returns SCRATCH_ORG_REASSIGN action', () => {
    const org = { id: 'org-id' };
    const expected = { type: 'SCRATCH_ORG_REASSIGN', payload: org };

    expect(actions.orgReassigned(org)).toEqual(expected);
  });
});

describe('orgReassignFailed', () => {
  test('adds error message', () => {
    const store = storeWithThunk(defaultState);
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_REASSIGN_FAILED',
      payload: org,
    };
    store.dispatch(
      actions.orgReassignFailed({
        model: org,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Uh oh. There was an error reassigning the scratch org for Task “My Task”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });

  test('adds error message [no known task]', () => {
    const store = storeWithThunk({
      ...defaultState,
      tasks: {},
    });
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    const action = {
      type: 'SCRATCH_ORG_REASSIGN_FAILED',
      payload: org,
    };
    store.dispatch(
      actions.orgReassignFailed({
        model: org,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error reassigning this scratch org.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });
});

describe('orgProvisioning', () => {
  beforeEach(() => {
    window.socket = { subscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('subscribes to socket and returns action', () => {
    const store = storeWithThunk(defaultState);
    const org = { id: 'org-id' };
    const action = { type: 'SCRATCH_ORG_PROVISIONING', payload: org };
    store.dispatch(actions.orgProvisioning(org));
    expect(store.getActions()).toEqual([action]);
    expect(window.socket.subscribe).toHaveBeenCalledWith({
      model: 'scratch_org',
      id: 'org-id',
    });
  });
});

describe('orgConvertFailed', () => {
  let replace;

  beforeEach(() => {
    replace = jest.fn();
  });

  test('adds error message', () => {
    const store = getStoreWithHistory({ replace })(defaultState);
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    store.dispatch(
      actions.orgConvertFailed({
        model: org,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Uh oh. There was an error contributing work from your Scratch Org on Task “My Task”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(replace).toHaveBeenCalledWith({ state: {} });
  });

  test('adds error message [no known task]', () => {
    const store = getStoreWithHistory({ replace })({
      ...defaultState,
      tasks: {},
    });
    const org = {
      id: 'org-id',
      task: 'task-id',
      owner: 'user-id',
    };
    store.dispatch(
      actions.orgConvertFailed({
        model: org,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error contributing work from your Scratch Org.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
  });
});
