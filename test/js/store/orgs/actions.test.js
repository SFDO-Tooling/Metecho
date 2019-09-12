import fetchMock from 'fetch-mock';

import * as actions from '@/store/orgs/actions';

import { storeWithThunk } from './../../utils';

describe('provisionOrg', () => {
  beforeEach(() => {
    window.socket = { unsubscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('unsubscribes from socket and returns action', () => {
    const store = storeWithThunk({});
    const org = { id: 'org-id', org_type: 'Dev' };
    const action = { type: 'SCRATCH_ORG_PROVISIONED', payload: org };
    store.dispatch(actions.provisionOrg(org));

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
  beforeEach(() => {
    window.socket = { unsubscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('unsubscribes from socket and returns action', () => {
    const store = storeWithThunk({});
    const org = { id: 'org-id' };
    const action = { type: 'SCRATCH_ORG_DELETE_FAILED', payload: org };
    store.dispatch(actions.deleteFailed({ model: org, message: 'error msg' }));

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

describe('getChangeset', () => {
  let url, org, payload;

  beforeAll(() => {
    org = { id: 'org-id' };
    url = window.api_urls.scratch_org_detail(org.id);
    payload = {
      org,
      url,
    };
  });

  describe('success', () => {
    test('GETs changeset from api', () => {
      const store = storeWithThunk({});
      const changeset = {
        id: 'changeset-id',
        task: 'task-id',
        changes: {},
      };
      fetchMock.getOnce(url, changeset);
      const started = {
        type: 'REQUEST_CHANGESET_STARTED',
        payload,
      };
      const succeeded = {
        type: 'REQUEST_CHANGESET_SUCCEEDED',
        payload: { changeset, ...payload },
      };

      expect.assertions(1);
      return store.dispatch(actions.getChangeset({ org })).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });

    describe('with socket', () => {
      beforeEach(() => {
        window.socket = { subscribe: jest.fn() };
      });

      afterEach(() => {
        Reflect.deleteProperty(window, 'socket');
      });

      test('subscribes to socket', () => {
        const store = storeWithThunk({});
        const changeset = {
          id: 'changeset-id',
          task: 'task-id',
          changes: {},
        };
        fetchMock.getOnce(url, changeset);

        expect.assertions(1);
        return store.dispatch(actions.getChangeset({ org })).then(() => {
          expect(window.socket.subscribe).toHaveBeenCalledWith({
            model: 'scratch_org_changeset',
            id: 'changeset-id',
          });
        });
      });
    });
  });

  describe('error', () => {
    test('dispatches REQUEST_CHANGESET_FAILED action', () => {
      const store = storeWithThunk({});
      fetchMock.getOnce(url, 500);
      const started = {
        type: 'REQUEST_CHANGESET_STARTED',
        payload,
      };
      const failed = {
        type: 'REQUEST_CHANGESET_FAILED',
        payload,
      };

      expect.assertions(4);
      return store.dispatch(actions.getChangeset({ org })).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('addChangeset', () => {
  beforeEach(() => {
    window.socket = { unsubscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('unsubscribes from socket and returns action', () => {
    const store = storeWithThunk({});
    const changeset = { id: 'changeset-id' };
    const action = { type: 'CHANGESET_SUCCEEDED', payload: changeset };
    store.dispatch(actions.addChangeset(changeset));

    expect(store.getActions()).toEqual([action]);
    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org_changeset',
      id: 'changeset-id',
    });
  });
});

describe('changesetFailed', () => {
  beforeEach(() => {
    window.socket = { unsubscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('unsubscribes from socket', () => {
    const store = storeWithThunk({ tasks: {} });
    const changeset = { id: 'changeset-id', task: 'task-id' };
    store.dispatch(actions.changesetFailed({ model: changeset }));

    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org_changeset',
      id: 'changeset-id',
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
    const changeset = {
      id: 'changeset-id',
      task: 'task-id',
    };
    const action = {
      type: 'CHANGESET_FAILED',
      payload: changeset,
    };
    store.dispatch(
      actions.changesetFailed({ model: changeset, message: 'error msg' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error capturing changes from your scratch org on task “My Task”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });
});

describe('cancelChangeset', () => {
  test('returns CHANGESET_CANCELED action', () => {
    const commit = { id: 'commit-id', task: 'task-id' };
    const expected = { type: 'CHANGESET_CANCELED', payload: commit };

    expect(actions.cancelChangeset(commit)).toEqual(expected);
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
