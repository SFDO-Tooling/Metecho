import fetchMock from 'fetch-mock';

import { storeWithApi } from './../../utils';

import * as actions from 'store/user/actions';

describe('login', () => {
  beforeEach(() => {
    window.socket = { subscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('returns LoginAction', () => {
    const user = {
      username: 'Test User',
      email: 'test@foo.bar',
    };
    const expected = {
      type: 'USER_LOGGED_IN',
      payload: user,
    };

    expect(actions.login(user)).toEqual(expected);
  });

  test('subscribes to user ws events', () => {
    const user = {
      id: 'user-id',
      username: 'Test User',
      email: 'test@foo.bar',
    };
    const userSubscription = {
      model: 'user',
      id: 'user-id',
    };
    actions.login(user);

    expect(window.socket.subscribe).toHaveBeenCalledWith(userSubscription);
  });

  describe('with Raven', () => {
    beforeEach(() => {
      window.Raven = {
        isSetup: () => true,
        setUserContext: jest.fn(),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Raven');
    });

    test('sets user context', () => {
      const user = {
        username: 'Test User',
        email: 'test@foo.bar',
      };
      actions.login(user);

      expect(window.Raven.setUserContext).toHaveBeenCalledWith(user);
    });
  });
});

describe('logout', () => {
  let store;

  beforeEach(() => {
    store = storeWithApi({});
    fetchMock.postOnce(window.api_urls.account_logout(), {
      status: 204,
      body: {},
    });
    window.socket = { reconnect: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('dispatches LogoutAction', () => {
    const loggedOut = {
      type: 'USER_LOGGED_OUT',
    };

    expect.assertions(1);
    return store.dispatch(actions.logout()).then(() => {
      expect(store.getActions()).toEqual([loggedOut]);
    });
  });

  test('reconnects socket', () => {
    expect.assertions(1);
    return store.dispatch(actions.logout()).then(() => {
      expect(window.socket.reconnect).toHaveBeenCalled();
    });
  });

  describe('with Raven', () => {
    beforeEach(() => {
      window.Raven = {
        isSetup: () => true,
        setUserContext: jest.fn(),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Raven');
    });

    test('resets user context', () => {
      expect.assertions(1);
      return store.dispatch(actions.logout()).then(() => {
        expect(window.Raven.setUserContext).toHaveBeenCalledWith();
      });
    });
  });
});

describe('refetchAllData', () => {
  describe('success', () => {
    test('GETs user from api', () => {
      const store = storeWithApi({});
      const user = { id: 'me' };
      fetchMock.getOnce(window.api_urls.user(), user);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const succeeded = { type: 'REFETCH_DATA_SUCCEEDED' };
      const loggedOut = { type: 'USER_LOGGED_OUT' };
      const loggedIn = {
        type: 'USER_LOGGED_IN',
        payload: user,
      };

      expect.assertions(1);
      return store.dispatch(actions.refetchAllData()).then(() => {
        expect(store.getActions()).toEqual([
          started,
          succeeded,
          loggedOut,
          loggedIn,
        ]);
      });
    });

    test('handles missing user', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.user(), 401);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const succeeded = { type: 'REFETCH_DATA_SUCCEEDED' };
      const loggedOut = { type: 'USER_LOGGED_OUT' };

      expect.assertions(1);
      return store.dispatch(actions.refetchAllData()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded, loggedOut]);
      });
    });
  });

  describe('error', () => {
    test('dispatches REFETCH_DATA_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.user(), 500);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const failed = { type: 'REFETCH_DATA_FAILED' };

      expect.assertions(2);
      return store.dispatch(actions.refetchAllData()).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
