import fetchMock from 'fetch-mock';

import * as actions from '@/js/store/user/actions';

import { storeWithThunk } from './../../utils';

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

  describe('with Sentry', () => {
    beforeEach(() => {
      window.Sentry = {
        setUser: jest.fn(),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Sentry');
    });

    test('sets user context', () => {
      const user = {
        username: 'Test User',
        email: 'test@foo.bar',
      };
      actions.login(user);

      expect(window.Sentry.setUser).toHaveBeenCalledWith(user);
    });
  });
});

describe('logout', () => {
  let store;

  beforeEach(() => {
    store = storeWithThunk({});
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

  describe('with Sentry', () => {
    let scope;

    beforeEach(() => {
      scope = {
        clear: jest.fn(),
      };
      window.Sentry = {
        configureScope: (cb) => cb(scope),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Sentry');
    });

    test('resets user context', () => {
      expect.assertions(1);
      return store.dispatch(actions.logout()).then(() => {
        expect(scope.clear).toHaveBeenCalled();
      });
    });
  });
});

describe('refetchAllData', () => {
  describe('success', () => {
    test('GETs user from api, re-fetches projects', () => {
      const store = storeWithThunk({});
      const user = { id: 'me' };
      fetchMock.getOnce(window.api_urls.current_user_detail(), user);
      fetchMock.getOnce(window.api_urls.project_list(), []);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const succeeded = { type: 'REFETCH_DATA_SUCCEEDED' };
      const loggedIn = {
        type: 'USER_LOGGED_IN',
        payload: user,
      };
      const refreshingProjects = { type: 'REFRESHING_PROJECTS' };
      const refreshedProjects = { type: 'PROJECTS_REFRESHED' };
      const projectPayload = {
        filters: {},
        objectType: 'project',
        reset: true,
        url: window.api_urls.project_list(),
      };
      const fetchingProjects = {
        type: 'FETCH_OBJECTS_STARTED',
        payload: projectPayload,
      };

      expect.assertions(1);
      return store.dispatch(actions.refetchAllData()).then(() => {
        expect(store.getActions()).toEqual([
          started,
          loggedIn,
          refreshingProjects,
          refreshedProjects,
          fetchingProjects,
          succeeded,
        ]);
      });
    });

    test('handles missing user', () => {
      const store = storeWithThunk({});
      fetchMock.getOnce(window.api_urls.current_user_detail(), 401);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const loggedOut = { type: 'USER_LOGGED_OUT' };

      expect.assertions(1);
      return store.dispatch(actions.refetchAllData()).then(() => {
        expect(store.getActions()).toEqual([started, loggedOut]);
      });
    });
  });

  describe('error', () => {
    test('dispatches REFETCH_DATA_FAILED action', async () => {
      const store = storeWithThunk({});
      fetchMock.getOnce(window.api_urls.current_user_detail(), 500);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const failed = { type: 'REFETCH_DATA_FAILED' };

      expect.assertions(4);
      try {
        await store.dispatch(actions.refetchAllData());
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('disconnect', () => {
  let url;

  beforeAll(() => {
    url = window.api_urls.current_user_disconnect();
  });

  describe('success', () => {
    test('returns updated user', () => {
      const store = storeWithThunk({});
      const user = { id: 'me' };
      fetchMock.postOnce(url, user);
      const started = { type: 'USER_DISCONNECT_REQUESTED' };
      const succeeded = { type: 'USER_DISCONNECT_SUCCEEDED', payload: user };

      expect.assertions(1);
      return store.dispatch(actions.disconnect()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches USER_DISCONNECT_FAILED action', async () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(url, 500);
      const started = { type: 'USER_DISCONNECT_REQUESTED' };
      const failed = { type: 'USER_DISCONNECT_FAILED' };

      expect.assertions(4);
      try {
        await store.dispatch(actions.disconnect());
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('refreshUser', () => {
  let url;

  beforeAll(() => {
    url = window.api_urls.current_user_detail();
  });

  describe('success', () => {
    test('returns updated user', () => {
      const store = storeWithThunk({});
      const user = { id: 'me' };
      fetchMock.getOnce(url, user);
      const started = { type: 'USER_REFRESH_REQUESTED' };
      const succeeded = { type: 'USER_REFRESH_SUCCEEDED', payload: user };

      expect.assertions(1);
      return store.dispatch(actions.refreshUser()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches USER_REFRESH_FAILED action', async () => {
      const store = storeWithThunk({});
      fetchMock.getOnce(url, 500);
      const started = { type: 'USER_REFRESH_REQUESTED' };
      const failed = { type: 'USER_REFRESH_FAILED' };

      expect.assertions(4);
      try {
        await store.dispatch(actions.refreshUser());
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('agreeToTerms', () => {
  let url;

  beforeAll(() => {
    url = window.api_urls.current_user_agree_to_tos();
  });

  describe('success', () => {
    test('returns updated user', () => {
      const store = storeWithThunk({});
      const user = { id: 'me' };
      fetchMock.putOnce(url, user);
      const started = { type: 'AGREE_TO_TERMS_REQUESTED' };
      const succeeded = { type: 'AGREE_TO_TERMS_SUCCEEDED', payload: user };

      expect.assertions(1);
      return store.dispatch(actions.agreeToTerms()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches AGREE_TO_TERMS_FAILED action', async () => {
      const store = storeWithThunk({});
      fetchMock.putOnce(url, 500);
      const started = { type: 'AGREE_TO_TERMS_REQUESTED' };
      const failed = { type: 'AGREE_TO_TERMS_FAILED' };

      expect.assertions(4);
      try {
        await store.dispatch(actions.agreeToTerms());
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('onboarded', () => {
  let url;

  beforeAll(() => {
    url = window.api_urls.current_user_complete_onboarding();
  });

  describe('success', () => {
    test('sets user onboarded_at', () => {
      const store = storeWithThunk({});
      const user = { id: 'testuser', onboarded_at: 'now' };
      fetchMock.putOnce(url, user);
      const started = { type: 'ONBOARDING_REQUESTED' };
      const succeeded = {
        type: 'ONBOARDING_SUCCEEDED',
        payload: user,
      };

      expect.assertions(1);
      return store.dispatch(actions.onboarded()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches ONBOARDING_FAILED action', async () => {
      const store = storeWithThunk({});
      fetchMock.putOnce(url, 500);
      const started = { type: 'ONBOARDING_REQUESTED' };
      const failed = { type: 'ONBOARDING_FAILED' };

      expect.assertions(4);
      try {
        await store.dispatch(actions.onboarded());
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('updateTour', () => {
  let url;

  beforeAll(() => {
    url = window.api_urls.current_user_guided_tour();
  });

  describe('success', () => {
    test('sets self_guided_tour_enabled', () => {
      const store = storeWithThunk({});
      const user = { id: 'testuser', self_guided_tour_enabled: true };
      fetchMock.postOnce(url, user);
      const started = { type: 'TOUR_UPDATE_REQUESTED' };
      const succeeded = {
        type: 'TOUR_UPDATE_SUCCEEDED',
        payload: user,
      };

      expect.assertions(1);
      return store.dispatch(actions.updateTour()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });

    test('sets self_guided_tour_state', () => {
      const store = storeWithThunk({});
      const user = { id: 'testuser', self_guided_tour_state: ['123'] };
      fetchMock.postOnce(url, user);
      const started = { type: 'TOUR_UPDATE_REQUESTED' };
      const succeeded = {
        type: 'TOUR_UPDATE_SUCCEEDED',
        payload: user,
      };

      expect.assertions(1);
      return store.dispatch(actions.updateTour()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches TOUR_UPDATE_FAILED action', async () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(url, 500);
      const started = { type: 'TOUR_UPDATE_REQUESTED' };
      const failed = { type: 'TOUR_UPDATE_FAILED' };

      expect.assertions(4);
      try {
        await store.dispatch(actions.updateTour());
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('refreshOrgs', () => {
  let url;

  beforeAll(() => {
    url = window.api_urls.current_user_refresh_orgs();
  });

  describe('success', () => {
    test('dispatches REFRESHING_ORGS action', () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(url, 202);
      const started = { type: 'REFRESH_ORGS_REQUESTED' };
      const succeeded = { type: 'REFRESHING_ORGS' };

      expect.assertions(1);
      return store.dispatch(actions.refreshOrgs()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches REFRESH_ORGS_REJECTED action', async () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(url, 500);
      const started = { type: 'REFRESH_ORGS_REQUESTED' };
      const failed = { type: 'REFRESH_ORGS_REJECTED' };

      expect.assertions(4);
      try {
        await store.dispatch(actions.refreshOrgs());
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('orgsRefreshError', () => {
  test('adds toast and dispatches REFRESH_ORGS_ERROR action', () => {
    const store = storeWithThunk({});
    const action = { type: 'REFRESH_ORGS_ERROR' };
    store.dispatch(actions.orgsRefreshError('error msg'));
    const allActions = store.getActions();

    expect(allActions[0].type).toBe('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Uh oh. There was an error re-syncing your GitHub Organizations.',
    );
    expect(allActions[0].payload.details).toBe('error msg');
    expect(allActions[0].payload.variant).toBe('error');
    expect(allActions[1]).toEqual(action);
  });
});
