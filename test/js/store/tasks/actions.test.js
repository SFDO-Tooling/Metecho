import * as actions from '@/store/tasks/actions';

import { storeWithThunk } from './../../utils';

describe('updateTask', () => {
  test('returns TaskUpdated', () => {
    const expected = { type: 'TASK_UPDATE', payload: {} };

    expect(actions.updateTask({})).toEqual(expected);
  });
});

describe('createPR', () => {
  test('adds success message', () => {
    const store = storeWithThunk({});
    const task = {
      id: 'task-id',
      name: 'My Task',
      pr_url: 'my-pr-url',
    };
    const action = {
      type: 'TASK_UPDATE',
      payload: task,
    };
    store.dispatch(actions.createPR(task));
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully submitted task for review: “My Task”.',
    );
    expect(allActions[0].payload.linkText).toEqual('View pull request.');
    expect(allActions[0].payload.linkUrl).toEqual('my-pr-url');
    expect(allActions[1]).toEqual(action);
  });

  test('adds success message [no pr url]', () => {
    const store = storeWithThunk({});
    const task = {
      id: 'task-id',
      name: 'My Task',
    };
    const action = {
      type: 'TASK_UPDATE',
      payload: task,
    };
    store.dispatch(actions.createPR(task));
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully submitted task for review: “My Task”.',
    );
    expect(allActions[0].payload.linkText).toBe(undefined);
    expect(allActions[0].payload.linkUrl).toBe(undefined);
    expect(allActions[1]).toEqual(action);
  });
});

describe('createPRFailed', () => {
  test('adds error message', () => {
    const store = storeWithThunk({});
    const task = {
      id: 'task-id',
      name: 'My Task',
    };
    const action = {
      type: 'TASK_CREATE_PR_FAILED',
      payload: task,
    };
    store.dispatch(
      actions.createPRFailed({ model: task, message: 'error msg' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error submitting task for review: “My Task”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });
});
