import * as actions from '@/js/store/tasks/actions';

import { storeWithThunk } from './../../utils';

describe('createTask', () => {
  test('returns TaskCreated', () => {
    const expected = { type: 'TASK_CREATE', payload: {} };

    expect(actions.createTask({})).toEqual(expected);
  });
});

describe('updateTask', () => {
  test('returns TaskUpdated', () => {
    const expected = { type: 'TASK_UPDATE', payload: {} };

    expect(actions.updateTask({})).toEqual(expected);
  });
});

describe('createTaskPR', () => {
  test('adds success message when user is owner', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const task = {
      id: 'task-id',
      name: 'My Task',
      pr_url: 'my-pr-url',
    };
    const action = {
      type: 'TASK_UPDATE',
      payload: task,
    };
    store.dispatch(
      actions.createTaskPR({ model: task, originating_user_id: 'user-id' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toBe('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Successfully submitted Task for testing: “My Task.”',
    );
    expect(allActions[0].payload.linkText).toBe('View pull request.');
    expect(allActions[0].payload.linkUrl).toBe('my-pr-url');
    expect(allActions[1]).toEqual(action);
  });

  test('no success message when user is not owner', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const task = {
      id: 'task-id',
      name: 'My Task',
      pr_url: 'my-pr-url',
    };
    const action = {
      type: 'TASK_UPDATE',
      payload: task,
    };
    store.dispatch(
      actions.createTaskPR({
        model: task,
        originating_user_id: 'another-user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions).toEqual([action]);
  });

  test('adds success message [no pr url]', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const task = {
      id: 'task-id',
      name: 'My Task',
    };
    const action = {
      type: 'TASK_UPDATE',
      payload: task,
    };
    store.dispatch(
      actions.createTaskPR({ model: task, originating_user_id: 'user-id' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toBe('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Successfully submitted Task for testing: “My Task.”',
    );
    expect(allActions[0].payload.linkText).toBeUndefined();
    expect(allActions[0].payload.linkUrl).toBeUndefined();
    expect(allActions[1]).toEqual(action);
  });
});

describe('createTaskPRFailed', () => {
  test('adds error message when user is owner', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const task = {
      id: 'task-id',
      name: 'My Task',
    };
    const action = {
      type: 'TASK_CREATE_PR_FAILED',
      payload: task,
    };
    store.dispatch(
      actions.createTaskPRFailed({
        model: task,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toBe('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Uh oh. There was an error submitting Task for testing: “My Task.”',
    );
    expect(allActions[0].payload.details).toBe('error msg');
    expect(allActions[0].payload.variant).toBe('error');
    expect(allActions[1]).toEqual(action);
  });

  test('no error message when user is not owner', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const task = {
      id: 'task-id',
      name: 'My Task',
      pr_url: 'my-pr-url',
    };
    const action = {
      type: 'TASK_CREATE_PR_FAILED',
      payload: task,
    };
    store.dispatch(
      actions.createTaskPRFailed({
        model: task,
        originating_user_id: 'another-user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions).toEqual([action]);
  });
});

describe('submitReview', () => {
  test('adds success message when user is owner', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const task = {
      id: 'task-id',
      name: 'My Task',
      pr_url: 'my-pr-url',
    };
    const action = {
      type: 'TASK_UPDATE',
      payload: task,
    };
    store.dispatch(
      actions.submitReview({ model: task, originating_user_id: 'user-id' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toBe('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Successfully submitted review for Task: “My Task.”',
    );
    expect(allActions[0].payload.linkText).toBe('View pull request.');
    expect(allActions[0].payload.linkUrl).toBe('my-pr-url');
    expect(allActions[1]).toEqual(action);
  });

  test('no success message when user is not owner', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const task = {
      id: 'task-id',
      name: 'My Task',
      pr_url: 'my-pr-url',
    };
    const action = {
      type: 'TASK_UPDATE',
      payload: task,
    };
    store.dispatch(
      actions.submitReview({
        model: task,
        originating_user_id: 'another-user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions).toEqual([action]);
  });

  test('adds success message [no pr url]', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const task = {
      id: 'task-id',
      name: 'My Task',
    };
    const action = {
      type: 'TASK_UPDATE',
      payload: task,
    };
    store.dispatch(
      actions.submitReview({ model: task, originating_user_id: 'user-id' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toBe('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Successfully submitted review for Task: “My Task.”',
    );
    expect(allActions[0].payload.linkText).toBeUndefined();
    expect(allActions[0].payload.linkUrl).toBeUndefined();
    expect(allActions[1]).toEqual(action);
  });
});

describe('submitReviewFailed', () => {
  test('adds error message when user is owner', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const task = {
      id: 'task-id',
      name: 'My Task',
    };
    const action = {
      type: 'TASK_UPDATE',
      payload: task,
    };
    store.dispatch(
      actions.submitReviewFailed({
        model: task,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toBe('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Uh oh. There was an error submitting review for Task: “My Task.”',
    );
    expect(allActions[0].payload.details).toBe('error msg');
    expect(allActions[0].payload.variant).toBe('error');
    expect(allActions[1]).toEqual(action);
  });

  test('no error message when user is not owner', () => {
    const store = storeWithThunk({ user: { id: 'user-id' } });
    const task = {
      id: 'task-id',
      name: 'My Task',
    };
    const action = {
      type: 'TASK_UPDATE',
      payload: task,
    };
    store.dispatch(
      actions.submitReviewFailed({
        model: task,
        message: 'error msg',
        originating_user_id: 'another-user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions).toEqual([action]);
  });
});
