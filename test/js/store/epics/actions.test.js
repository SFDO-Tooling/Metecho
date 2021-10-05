import * as actions from '@/js/store/epics/actions';

import { storeWithThunk } from './../../utils';

describe('createEpic', () => {
  test('returns EpicCreated', () => {
    const expected = { type: 'EPIC_CREATE', payload: {} };

    expect(actions.createEpic({})).toEqual(expected);
  });
});

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
    expect(allActions[0].payload.heading).toMatch(
      'Successfully submitted Epic for review on GitHub: “My Epic.”',
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
    expect(allActions[0].payload.heading).toMatch(
      'Successfully submitted Epic for review on GitHub: “My Epic.”',
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
    expect(allActions[0].payload.heading).toMatch(
      'Uh oh. There was an error submitting Epic for review on GitHub: “My Epic.”',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });
});
