import fetchMock from 'fetch-mock';

import * as actions from '@/store/projects/actions';

import { storeWithThunk } from './../../utils';

describe('updateProject', () => {
  test('returns ProjectUpdated', () => {
    const expected = { type: 'PROJECT_UPDATE', payload: {} };

    expect(actions.updateProject({})).toEqual(expected);
  });
});

describe('createProjectPR', () => {
  test('adds success message', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const project = {
      id: 'project-id',
      name: 'My Project',
      pr_url: 'my-pr-url',
    };
    const action = {
      type: 'PROJECT_UPDATE',
      payload: project,
    };
    store.dispatch(
      actions.createProjectPR({
        model: project,
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully submitted project for review on GitHub: “My Project”.',
    );
    expect(allActions[0].payload.linkText).toEqual('View pull request.');
    expect(allActions[0].payload.linkUrl).toEqual('my-pr-url');
    expect(allActions[1]).toEqual(action);
  });

  test('adds success message [no pr url]', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const project = {
      id: 'project-id',
      name: 'My Project',
    };
    const action = {
      type: 'PROJECT_UPDATE',
      payload: project,
    };
    store.dispatch(
      actions.createProjectPR({
        model: project,
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully submitted project for review on GitHub: “My Project”.',
    );
    expect(allActions[0].payload.linkText).toBeUndefined();
    expect(allActions[0].payload.linkUrl).toBeUndefined();
    expect(allActions[1]).toEqual(action);
  });
});

describe('createProjectPRFailed', () => {
  test('adds error message', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const project = {
      id: 'project-id',
      name: 'My Project',
    };
    const action = {
      type: 'PROJECT_CREATE_PR_FAILED',
      payload: project,
    };
    store.dispatch(
      actions.createProjectPRFailed({
        model: project,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error submitting project for review on GitHub: “My Project”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });
});

describe('refreshOrgConfigs', () => {
  const id = 'project-id';
  let url;

  beforeAll(() => {
    url = window.api_urls.project_refresh_org_config_names(id);
  });

  test('dispatches RefreshOrgConfigs actions', () => {
    const store = storeWithThunk({});
    fetchMock.postOnce(url, 202);
    const RefreshOrgConfigsRequested = {
      type: 'REFRESH_ORG_CONFIGS_REQUESTED',
      payload: id,
    };
    const RefreshOrgConfigsAccepted = {
      type: 'REFRESH_ORG_CONFIGS_ACCEPTED',
      payload: id,
    };

    expect.assertions(1);
    return store.dispatch(actions.refreshOrgConfigs(id)).then(() => {
      expect(store.getActions()).toEqual([
        RefreshOrgConfigsRequested,
        RefreshOrgConfigsAccepted,
      ]);
    });
  });

  describe('error', () => {
    test('dispatches REFRESH_ORG_CONFIGS_REJECTED action', () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(url, {
        status: 500,
        body: { non_field_errors: ['Foobar'] },
      });
      const started = {
        type: 'REFRESH_ORG_CONFIGS_REQUESTED',
        payload: id,
      };
      const failed = {
        type: 'REFRESH_ORG_CONFIGS_REJECTED',
        payload: id,
      };

      expect.assertions(5);
      return store.dispatch(actions.refreshOrgConfigs(id)).catch(() => {
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
