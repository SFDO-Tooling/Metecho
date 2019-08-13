import fetchMock from 'fetch-mock';

import * as actions from '@/store/repositories/actions';

import { storeWithThunk } from './../../utils';

describe('syncRepos', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.repository_list();
    objectPayload = {
      objectType: 'repository',
      url,
      reset: true,
      filters: {},
    };
  });

  test('dispatches SyncRepos action and fetches repositories', () => {
    const store = storeWithThunk({});
    fetchMock.getOnce(url, {
      next: null,
      results: [],
    });
    fetchMock.postOnce(window.api_urls.user_refresh(), {
      status: 204,
      body: {},
    });
    const syncReposStarted = {
      type: 'SYNC_REPOS_STARTED',
    };
    const syncReposSucceeded = {
      type: 'SYNC_REPOS_SUCCEEDED',
    };
    const started = {
      type: 'FETCH_OBJECTS_STARTED',
      payload: objectPayload,
    };
    const succeeded = {
      type: 'FETCH_OBJECTS_SUCCEEDED',
      payload: {
        response: { next: null, results: [] },
        ...objectPayload,
      },
    };

    expect.assertions(1);
    return store.dispatch(actions.syncRepos()).then(() => {
      expect(store.getActions()).toEqual([
        syncReposStarted,
        syncReposSucceeded,
        started,
        succeeded,
      ]);
    });
  });

  describe('error', () => {
    test('dispatches SYNC_REPOS_FAILED action', () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(window.api_urls.user_refresh(), {
        status: 500,
        body: { non_field_errors: ['Foobar'] },
      });
      const started = {
        type: 'SYNC_REPOS_STARTED',
      };
      const failed = {
        type: 'SYNC_REPOS_FAILED',
      };

      expect.assertions(5);
      return store.dispatch(actions.syncRepos()).catch(() => {
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
