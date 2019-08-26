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
    const org = { id: 'org-id' };
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
      const store = storeWithThunk({ user: { id: 'user-id' } });
      const org = {
        id: 'org-id',
        owner: 'user-id',
        url: '/test/url/',
        org_type: 'Dev',
      };
      const orgAction = { type: 'SCRATCH_ORG_PROVISIONED', payload: org };
      store.dispatch(actions.provisionOrg(org));
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Successfully created Dev org.',
      );
      expect(allActions[0].payload.linkText).toEqual('View your new org.');
      expect(allActions[0].payload.linkUrl).toEqual(org.url);
      expect(allActions[1]).toEqual(orgAction);
    });

    test('does not fail if missing url', () => {
      const store = storeWithThunk({ user: { id: 'user-id' } });
      const org = { id: 'org-id', owner: 'user-id', org_type: 'Dev' };
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
    store.dispatch(actions.provisionFailed({ model: org, error: 'error msg' }));

    expect(store.getActions()).toEqual([action]);
    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org',
      id: 'org-id',
    });
  });

  describe('owned by current user', () => {
    test('adds error message', () => {
      const store = storeWithThunk({ user: { id: 'user-id' } });
      const org = {
        id: 'org-id',
        owner: 'user-id',
        org_type: 'Dev',
      };
      const orgAction = {
        type: 'SCRATCH_ORG_PROVISION_FAILED',
        payload: org,
      };
      store.dispatch(
        actions.provisionFailed({ model: org, error: 'error msg' }),
      );
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Uh oh. There was an error creating your new Dev org.',
      );
      expect(allActions[0].payload.details).toEqual('error msg');
      expect(allActions[0].payload.variant).toEqual('error');
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
      const store = storeWithThunk({ user: { id: 'user-id' } });
      const org = {
        id: 'org-id',
        owner: 'user-id',
        url: '/test/url/',
        org_type: 'Dev',
      };
      const orgAction = { type: 'SCRATCH_ORG_DELETED', payload: org };
      store.dispatch(actions.deleteOrg(org));
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Successfully deleted Dev org.',
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
    store.dispatch(actions.deleteFailed({ model: org, error: 'error msg' }));

    expect(store.getActions()).toEqual([action]);
    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org',
      id: 'org-id',
    });
  });

  describe('owned by current user', () => {
    test('adds error message', () => {
      const store = storeWithThunk({ user: { id: 'user-id' } });
      const org = {
        id: 'org-id',
        owner: 'user-id',
        org_type: 'Dev',
      };
      const orgAction = {
        type: 'SCRATCH_ORG_DELETE_FAILED',
        payload: org,
      };
      store.dispatch(actions.deleteFailed({ model: org, error: 'error msg' }));
      const allActions = store.getActions();

      expect(allActions[0].type).toEqual('TOAST_ADDED');
      expect(allActions[0].payload.heading).toEqual(
        'Uh oh. There was an error deleting your Dev org.',
      );
      expect(allActions[0].payload.details).toEqual('error msg');
      expect(allActions[0].payload.variant).toEqual('error');
      expect(allActions[1]).toEqual(orgAction);
    });
  });
});
