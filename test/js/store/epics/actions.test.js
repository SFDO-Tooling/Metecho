import fetchMock from 'fetch-mock';

import * as actions from '~js/store/epics/actions';

import { storeWithThunk } from './../../utils';

describe('updateEpic', () => {
  test('returns EpicUpdated', () => {
    const expected = { type: 'EPIC_UPDATE', payload: {} };

    expect(actions.updateEpic({})).toEqual(expected);
  });
});

describe('createEpicPR', () => {
  test('adds success message', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const epic = {
      id: 'epic-id',
      name: 'My Epic',
      pr_url: 'my-pr-url',
    };
    const action = {
      type: 'EPIC_UPDATE',
      payload: epic,
    };
    store.dispatch(
      actions.createEpicPR({
        model: epic,
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully submitted epic for review on GitHub: “My Epic”.',
    );
    expect(allActions[0].payload.linkText).toEqual('View pull request.');
    expect(allActions[0].payload.linkUrl).toEqual('my-pr-url');
    expect(allActions[1]).toEqual(action);
  });

  test('adds success message [no pr url]', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const epic = {
      id: 'epic-id',
      name: 'My Epic',
    };
    const action = {
      type: 'EPIC_UPDATE',
      payload: epic,
    };
    store.dispatch(
      actions.createEpicPR({
        model: epic,
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully submitted epic for review on GitHub: “My Epic”.',
    );
    expect(allActions[0].payload.linkText).toBeUndefined();
    expect(allActions[0].payload.linkUrl).toBeUndefined();
    expect(allActions[1]).toEqual(action);
  });
});

describe('createEpicPRFailed', () => {
  test('adds error message', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const epic = {
      id: 'epic-id',
      name: 'My Epic',
    };
    const action = {
      type: 'EPIC_CREATE_PR_FAILED',
      payload: epic,
    };
    store.dispatch(
      actions.createEpicPRFailed({
        model: epic,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error submitting epic for review on GitHub: “My Epic”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });
});

describe('refreshOrgConfigs', () => {
  const id = 'epic-id';
  let url;

  beforeAll(() => {
    url = window.api_urls.epic_refresh_org_config_names(id);
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
