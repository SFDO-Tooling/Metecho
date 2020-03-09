import fetchMock from 'fetch-mock';

import { fetchObjects } from '@/store/actions';
import * as actions from '@/store/repositories/actions';
import { OBJECT_TYPES } from '@/utils/constants';

import { storeWithThunk } from './../../utils';

jest.mock('@/store/actions');

fetchObjects.mockReturnValue({ type: 'TEST', payload: {} });

describe('refreshRepos', () => {
  let url;

  beforeAll(() => {
    url = window.api_urls.repository_list();
  });

  test('dispatches RefreshRepos action', () => {
    const store = storeWithThunk({});
    fetchMock.getOnce(url, {
      next: null,
      results: [],
    });
    fetchMock.postOnce(window.api_urls.user_refresh(), {
      status: 204,
      body: {},
    });
    const RefreshReposRequested = {
      type: 'REFRESH_REPOS_REQUESTED',
    };
    const RefreshReposAccepted = {
      type: 'REFRESH_REPOS_ACCEPTED',
    };

    expect.assertions(1);
    return store.dispatch(actions.refreshRepos()).then(() => {
      expect(store.getActions()).toEqual([
        RefreshReposRequested,
        RefreshReposAccepted,
      ]);
    });
  });

  describe('error', () => {
    test('dispatches REFRESH_REPOS_REJECTED action', () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(window.api_urls.user_refresh(), {
        status: 500,
        body: { non_field_errors: ['Foobar'] },
      });
      const started = {
        type: 'REFRESH_REPOS_REQUESTED',
      };
      const failed = {
        type: 'REFRESH_REPOS_REJECTED',
      };

      expect.assertions(5);
      return store.dispatch(actions.refreshRepos()).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual(['Foobar']);
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('reposRefreshing', () => {
  test('returns REFRESHING_REPOS action', () => {
    const expected = { type: 'REFRESHING_REPOS' };

    expect(actions.reposRefreshing()).toEqual(expected);
  });
});

describe('reposRefreshed', () => {
  test('dispatches ReposRefreshed action', () => {
    const store = storeWithThunk({});
    const ReposRefreshed = {
      type: 'REPOS_REFRESHED',
    };
    store.dispatch(actions.reposRefreshed());

    expect(store.getActions()[0]).toEqual(ReposRefreshed);
    expect(fetchObjects).toHaveBeenCalledWith({
      objectType: OBJECT_TYPES.REPOSITORY,
      reset: true,
    });
  });
});

describe('refreshGitHubUsers', () => {
  const repoId = 'repo-id';
  let url;

  beforeAll(() => {
    url = window.api_urls.repository_refresh_github_users(repoId);
  });

  test('dispatches RefreshGitHubUsers actions', () => {
    const store = storeWithThunk({});
    fetchMock.postOnce(url, 202);
    const RefreshGitHubUsersRequested = {
      type: 'REFRESH_GH_USERS_REQUESTED',
      payload: repoId,
    };
    const RefreshGitHubUsersAccepted = {
      type: 'REFRESH_GH_USERS_ACCEPTED',
      payload: repoId,
    };

    expect.assertions(1);
    return store.dispatch(actions.refreshGitHubUsers(repoId)).then(() => {
      expect(store.getActions()).toEqual([
        RefreshGitHubUsersRequested,
        RefreshGitHubUsersAccepted,
      ]);
    });
  });

  describe('error', () => {
    test('dispatches REFRESH_GH_USERS_REJECTED action', () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(url, {
        status: 500,
        body: { non_field_errors: ['Foobar'] },
      });
      const started = {
        type: 'REFRESH_GH_USERS_REQUESTED',
        payload: repoId,
      };
      const failed = {
        type: 'REFRESH_GH_USERS_REJECTED',
        payload: repoId,
      };

      expect.assertions(5);
      return store.dispatch(actions.refreshGitHubUsers(repoId)).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual(['Foobar']);
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('updateRepo', () => {
  test('returns RepoUpdated', () => {
    const expected = { type: 'REPOSITORY_UPDATE', payload: {} };

    expect(actions.updateRepo({})).toEqual(expected);
  });
});

describe('repoError', () => {
  test('adds error message and updates repo', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const repo = {
      id: 'repo-id',
      name: 'My Repo',
    };
    const action = {
      type: 'REPOSITORY_UPDATE',
      payload: repo,
    };
    store.dispatch(
      actions.repoError({
        model: repo,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error re-syncing collaborators for this repository: “My Repo”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });

  test('bypasses and updates repo', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const repo = {
      id: 'repo-id',
      name: 'My Repo',
    };
    const action = {
      type: 'REPOSITORY_UPDATE',
      payload: repo,
    };
    store.dispatch(
      actions.repoError({
        model: repo,
        message: 'error msg',
        originating_user_id: 'another-user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions).toEqual([action]);
  });
});
