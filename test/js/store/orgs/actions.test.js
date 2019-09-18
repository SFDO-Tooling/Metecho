import fetchMock from 'fetch-mock';

import * as actions from '@/store/orgs/actions';

import { storeWithThunk } from './../../utils';

describe('provisionOrg', () => {
  describe('owned by current user', () => {
    test('adds success message', () => {
      const store = storeWithThunk({
        user: { id: 'user-id' },
        tasks: {
          'project-id': [
            { id: 'task-id', name: 'My Task', project: 'project-id' },
          ],
        },
      });
      const org = {
        id: 'org-id',
        owner: 'user-id',
        url: '/test/url/',
        org_type: 'Dev',
        task: 'task-id',
      };
      const orgAction = { type: 'SCRATCH_ORG_PROVISIONED', payload: org };
      store.dispatch(actions.provisionOrg(org));
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Successfully created Dev org for task “My Task”.',
      );
      expect(allActions[0].payload.linkText).toEqual('View your new org.');
      expect(allActions[0].payload.linkUrl).toEqual(org.url);
      expect(allActions[1]).toEqual(orgAction);
    });

    test('does not fail if missing url', () => {
      const store = storeWithThunk({ user: { id: 'user-id' }, tasks: {} });
      const org = {
        id: 'org-id',
        owner: 'user-id',
        org_type: 'Dev',
        task: 'task-id',
      };
      const orgAction = { type: 'SCRATCH_ORG_PROVISIONED', payload: org };
      store.dispatch(actions.provisionOrg(org));
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Successfully created Dev org.',
      );
      expect(allActions[0].payload.linkText).toBe(undefined);
      expect(allActions[0].payload.linkUrl).toBe(undefined);
      expect(allActions[1]).toEqual(orgAction);
    });
  });
});

describe('provisionFailed', () => {
  beforeEach(() => {
    window.socket = { unsubscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('unsubscribes from socket and returns action', () => {
    const store = storeWithThunk({});
    const org = { id: 'org-id' };
    const action = { type: 'SCRATCH_ORG_PROVISION_FAILED', payload: org };
    store.dispatch(
      actions.provisionFailed({ model: org, message: 'error msg' }),
    );

    expect(store.getActions()).toEqual([action]);
    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org',
      id: 'org-id',
    });
  });

  describe('owned by current user', () => {
    test('adds error message', () => {
      const store = storeWithThunk({
        user: { id: 'user-id' },
        tasks: {
          'project-id': [
            { id: 'task-id', name: 'My Task', project: 'project-id' },
          ],
        },
      });
      const org = {
        id: 'org-id',
        owner: 'user-id',
        url: '/test/url/',
        org_type: 'Dev',
        task: 'task-id',
      };
      const orgAction = {
        type: 'SCRATCH_ORG_PROVISION_FAILED',
        payload: org,
      };
      store.dispatch(
        actions.provisionFailed({ model: org, message: 'error msg' }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Uh oh. There was an error creating your new Dev org for task “My Task”.',
      );
      expect(allActions[0].payload.details).toEqual('error msg');
      expect(allActions[0].payload.variant).toEqual('error');
      expect(allActions[1]).toEqual(orgAction);
    });

    test('does not fail if missing url', () => {
      const store = storeWithThunk({ user: { id: 'user-id' }, tasks: {} });
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
        actions.provisionFailed({ model: org, message: 'error msg' }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Uh oh. There was an error creating your new Dev org.',
      );
      expect(allActions[0].payload.linkText).toBe(undefined);
      expect(allActions[0].payload.linkUrl).toBe(undefined);
      expect(allActions[1]).toEqual(orgAction);
    });
  });
});

describe('refetchOrg', () => {
  let url, payload;

  beforeAll(() => {
    url = window.api_urls.scratch_org_detail('org-id');
    const org = {
      id: 'org-id',
    };
    payload = { org, url };
  });

  test('GETs org from api', () => {
    const store = storeWithThunk({});
    const response = { id: 'org-id', currently_refreshing_changes: true };
    fetchMock.getOnce(url, response);
    const started = {
      type: 'REFETCH_ORG_STARTED',
      payload,
    };
    const succeeded = {
      type: 'REFETCH_ORG_SUCCEEDED',
      payload: response,
    };

    expect.assertions(1);
    return store.dispatch(actions.refetchOrg(payload.org)).then(() => {
      expect(store.getActions()).toEqual([started, succeeded]);
    });
  });

  test('handles null response', () => {
    const store = storeWithThunk({});
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
    test('dispatches REFETCH_ORG_FAILED action', () => {
      const store = storeWithThunk({});
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
      return store.dispatch(actions.refetchOrg(payload.org)).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[2]).toEqual(failed);
      });
    });
  });
});

describe('updateOrg', () => {
  test('returns SCRATCH_ORG_UPDATED action', () => {
    const org = { id: 'org-id' };
    const expected = { type: 'SCRATCH_ORG_UPDATED', payload: org };

    expect(actions.updateOrg(org)).toEqual(expected);
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
    const store = storeWithThunk({});
    const org = { id: 'org-id' };
    const action = { type: 'SCRATCH_ORG_DELETED', payload: org };
    store.dispatch(actions.deleteOrg(org));

    expect(store.getActions()).toEqual([action]);
    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org',
      id: 'org-id',
    });
  });

  describe('owned by current user', () => {
    test('adds success message', () => {
      const store = storeWithThunk({
        user: { id: 'user-id' },
        tasks: {
          'project-id': [
            { id: 'task-id', name: 'My Task', project: 'project-id' },
          ],
        },
      });
      const org = {
        id: 'org-id',
        owner: 'user-id',
        url: '/test/url/',
        org_type: 'Dev',
        task: 'task-id',
      };
      const orgAction = { type: 'SCRATCH_ORG_DELETED', payload: org };
      store.dispatch(actions.deleteOrg(org));
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Successfully deleted Dev org for task “My Task”.',
      );
      expect(allActions[1]).toEqual(orgAction);
    });
  });
});

describe('deleteFailed', () => {
  describe('owned by current user', () => {
    test('adds error message', () => {
      const store = storeWithThunk({
        user: { id: 'user-id' },
        tasks: {
          'project-id': [
            { id: 'task-id', name: 'My Task', project: 'project-id' },
          ],
        },
      });
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
        actions.deleteFailed({ model: org, message: 'error msg' }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Uh oh. There was an error deleting your Dev org for task “My Task”.',
      );
      expect(allActions[0].payload.details).toEqual('error msg');
      expect(allActions[0].payload.variant).toEqual('error');
      expect(allActions[1]).toEqual(orgAction);
    });
  });
});

describe('commitSucceeded', () => {
  beforeEach(() => {
    window.socket = { unsubscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('unsubscribes from socket', () => {
    const store = storeWithThunk({ tasks: {} });
    const commit = { id: 'commit-id', task: 'task-id' };
    store.dispatch(actions.commitSucceeded(commit));

    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org_commit',
      id: 'commit-id',
    });
  });

  test('adds error message', () => {
    const store = storeWithThunk({
      tasks: {
        'project-id': [
          { id: 'task-id', name: 'My Task', project: 'project-id' },
        ],
      },
    });
    const commit = {
      id: 'commit-id',
      task: 'task-id',
    };
    const action = {
      type: 'COMMIT_SUCCEEDED',
      payload: commit,
    };
    store.dispatch(actions.commitSucceeded(commit));
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully committed changes from your scratch org on task “My Task”.',
    );
    expect(allActions[1]).toEqual(action);
  });
});

describe('commitFailed', () => {
  beforeEach(() => {
    window.socket = { unsubscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('unsubscribes from socket', () => {
    const store = storeWithThunk({ tasks: {} });
    const commit = { id: 'commit-id', task: 'task-id' };
    store.dispatch(actions.commitFailed({ model: commit }));

    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org_commit',
      id: 'commit-id',
    });
  });

  test('adds error message', () => {
    const store = storeWithThunk({
      tasks: {
        'project-id': [
          { id: 'task-id', name: 'My Task', project: 'project-id' },
        ],
      },
    });
    const commit = {
      id: 'commit-id',
      task: 'task-id',
    };
    const action = {
      type: 'COMMIT_FAILED',
      payload: commit,
    };
    store.dispatch(
      actions.commitFailed({ model: commit, message: 'error msg' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error committing changes from your scratch org on task “My Task”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });
});
