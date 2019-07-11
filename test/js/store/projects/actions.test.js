import fetchMock from 'fetch-mock';

import * as actions from '@/store/projects/actions';

import { storeWithApi } from './../../utils';

describe('createProject', () => {
  describe('success', () => {
    test('dispatches CREATE_PROJECT_SUCCESS action', () => {
      const store = storeWithApi({});
      const project = {
        name: 'Project Name',
        description: 'Project Description',
      };
      fetchMock.postOnce(window.api_urls.project_list(), project);

      const started = {
        type: 'CREATE_PROJECT_STARTED',
      };
      const succeeded = {
        type: 'CREATE_PROJECT_SUCCEEDED',
      };
      return store.dispatch(actions.createProject(project)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
    test('dispatches CREATE_PROJECT_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.postOnce(window.api_urls.project_list(), {
        status: 500,
        body: {},
      });
      const started = {
        type: 'CREATE_PROJECT_STARTED',
      };
      const failed = {
        type: 'CREATE_PROJECT_FAILED',
      };

      return store.dispatch(actions.createProject({})).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
