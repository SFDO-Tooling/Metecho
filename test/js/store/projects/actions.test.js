import fetchMock from 'fetch-mock';

import * as actions from '@/store/projects/actions';

import { storeWithThunk } from './../../utils';

describe('updateProject', () => {
  test('returns ProjectUpdated', () => {
    const expected = { type: 'PROJECT_UPDATE', payload: {} };

    expect(actions.updateProject({})).toEqual(expected);
  });
});

describe('setUsersOnProject', () => {
  test('PUTs to API', async () => {
    const store = storeWithThunk({});
    const project = {
      id: 'project-id',
      name: 'My Project',
      github_users: [
        {
          id: '123456',
          login: 'TestGitHubUser',
          avatar_url: 'https://example.com/avatar.png',
        },
      ],
    };
    const action = {
      type: 'PROJECT_UPDATE',
      payload: project,
    };
    fetchMock.putOnce(window.api_urls.project_detail(project.id), project);
    await store.dispatch(actions.setUsersOnProject(project));
    const allActions = store.getActions();

    expect(allActions[0]).toEqual(action);
  });
  test('logs an error if an error happens', () => {
    const store = storeWithThunk({});
    const project = {
      id: 'project-id',
      name: 'My Project',
      github_users: [
        {
          id: '123456',
          login: 'TestGitHubUser',
          avatar_url: 'https://example.com/avatar.png',
        },
      ],
    };
    fetchMock.putOnce(window.api_urls.project_detail(project.id), 500);
    return store.dispatch(actions.setUsersOnProject(project)).catch(() => {
      expect(window.console.error).toHaveBeenCalled();
    });
  });
});

describe('createProjectPR', () => {
  test('adds success message', () => {
    const store = storeWithThunk({});
    const project = {
      id: 'project-id',
      name: 'My Project',
      pr_url: 'my-pr-url',
    };
    const action = {
      type: 'PROJECT_UPDATE',
      payload: project,
    };
    store.dispatch(actions.createProjectPR(project));
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully submitted project for review: “My Project”.',
    );
    expect(allActions[0].payload.linkText).toEqual('View pull request.');
    expect(allActions[0].payload.linkUrl).toEqual('my-pr-url');
    expect(allActions[1]).toEqual(action);
  });

  test('adds success message [no pr url]', () => {
    const store = storeWithThunk({});
    const project = {
      id: 'project-id',
      name: 'My Project',
    };
    const action = {
      type: 'PROJECT_UPDATE',
      payload: project,
    };
    store.dispatch(actions.createProjectPR(project));
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Successfully submitted project for review: “My Project”.',
    );
    expect(allActions[0].payload.linkText).toBe(undefined);
    expect(allActions[0].payload.linkUrl).toBe(undefined);
    expect(allActions[1]).toEqual(action);
  });
});

describe('createProjectPRFailed', () => {
  test('adds error message', () => {
    const store = storeWithThunk({});
    const project = {
      id: 'project-id',
      name: 'My Project',
    };
    const action = {
      type: 'PROJECT_CREATE_PR_FAILED',
      payload: project,
    };
    store.dispatch(
      actions.createProjectPRFailed({ model: project, message: 'error msg' }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toEqual(
      'Uh oh. There was an error submitting project for review: “My Project”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });
});
