import fetchMock from 'fetch-mock';

import { fetchObjects } from '~js/store/actions';
import * as actions from '~js/store/projects/actions';
import { OBJECT_TYPES } from '~js/utils/constants';

import { storeWithThunk } from './../../utils';

jest.mock('~js/store/actions');

fetchObjects.mockReturnValue({ type: 'TEST', payload: {} });

describe('refreshProjects', () => {
  let url;

  beforeAll(() => {
    url = window.api_urls.project_list();
  });

  test('dispatches RefreshProjects action', () => {
    const store = storeWithThunk({});
    fetchMock.getOnce(url, {
      next: null,
      results: [],
    });
    fetchMock.postOnce(window.api_urls.current_user_refresh(), {
      status: 204,
      body: {},
    });
    const RefreshProjectsRequested = {
      type: 'REFRESH_PROJECTS_REQUESTED',
    };
    const RefreshProjectsAccepted = {
      type: 'REFRESH_PROJECTS_ACCEPTED',
    };

    expect.assertions(1);
    return store.dispatch(actions.refreshProjects()).then(() => {
      expect(store.getActions()).toEqual([
        RefreshProjectsRequested,
        RefreshProjectsAccepted,
      ]);
    });
  });

  describe('error', () => {
    test('dispatches REFRESH_PROJECTS_REJECTED action', async () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(window.api_urls.current_user_refresh(), {
        status: 500,
        body: { non_field_errors: ['Foobar'] },
      });
      const started = {
        type: 'REFRESH_PROJECTS_REQUESTED',
      };
      const failed = {
        type: 'REFRESH_PROJECTS_REJECTED',
      };

      expect.assertions(4);
      try {
        await store.dispatch(actions.refreshProjects());
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual(['Foobar']);
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('projectsRefreshing', () => {
  test('returns REFRESHING_PROJECTS action', () => {
    const expected = { type: 'REFRESHING_PROJECTS' };

    expect(actions.projectsRefreshing()).toEqual(expected);
  });
});

describe('projectsRefreshed', () => {
  test('dispatches ProjectsRefreshed action', () => {
    const store = storeWithThunk({});
    const ProjectsRefreshed = {
      type: 'PROJECTS_REFRESHED',
    };
    store.dispatch(actions.projectsRefreshed());

    expect(store.getActions()[0]).toEqual(ProjectsRefreshed);
    expect(fetchObjects).toHaveBeenCalledWith({
      objectType: OBJECT_TYPES.PROJECT,
      reset: true,
    });
  });
});

describe('refreshGitHubUsers', () => {
  const projectId = 'project-id';
  let url;

  beforeAll(() => {
    url = window.api_urls.project_refresh_github_users(projectId);
  });

  test('dispatches RefreshGitHubUsers actions', () => {
    const store = storeWithThunk({});
    fetchMock.postOnce(url, 202);
    const RefreshGitHubUsersRequested = {
      type: 'REFRESH_GH_USERS_REQUESTED',
      payload: projectId,
    };
    const RefreshGitHubUsersAccepted = {
      type: 'REFRESH_GH_USERS_ACCEPTED',
      payload: projectId,
    };

    expect.assertions(1);
    return store.dispatch(actions.refreshGitHubUsers(projectId)).then(() => {
      expect(store.getActions()).toEqual([
        RefreshGitHubUsersRequested,
        RefreshGitHubUsersAccepted,
      ]);
    });
  });

  describe('error', () => {
    test('dispatches REFRESH_GH_USERS_REJECTED action', async () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(url, {
        status: 500,
        body: { non_field_errors: ['Foobar'] },
      });
      const started = {
        type: 'REFRESH_GH_USERS_REQUESTED',
        payload: projectId,
      };
      const failed = {
        type: 'REFRESH_GH_USERS_REJECTED',
        payload: projectId,
      };

      expect.assertions(4);
      try {
        await store.dispatch(actions.refreshGitHubUsers(projectId));
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual(['Foobar']);
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('updateProject', () => {
  test('returns ProjectUpdated', () => {
    const expected = { type: 'PROJECT_UPDATE', payload: {} };

    expect(actions.updateProject({})).toEqual(expected);
  });
});

describe('projectError', () => {
  test('adds error message and updates project', () => {
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
      actions.projectError({
        model: project,
        message: 'error msg',
        originating_user_id: 'user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions[0].type).toEqual('TOAST_ADDED');
    expect(allActions[0].payload.heading).toMatch(
      'Uh oh. There was an error re-syncing GitHub users for this project: “My Project”.',
    );
    expect(allActions[0].payload.details).toEqual('error msg');
    expect(allActions[0].payload.variant).toEqual('error');
    expect(allActions[1]).toEqual(action);
  });

  test('does not add message if not owned by current user', () => {
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
      actions.projectError({
        model: project,
        message: 'error msg',
        originating_user_id: 'another-user-id',
      }),
    );
    const allActions = store.getActions();

    expect(allActions).toEqual([action]);
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
    test('dispatches REFRESH_ORG_CONFIGS_REJECTED action', async () => {
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

      expect.assertions(4);
      try {
        await store.dispatch(actions.refreshOrgConfigs(id));
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual(['Foobar']);
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});
