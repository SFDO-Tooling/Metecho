import { fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import EpicDetail from '@/js/components/epics/detail';
import {
  createObject,
  fetchObject,
  fetchObjects,
  updateObject,
} from '@/js/store/actions';
import {
  refreshGitHubUsers,
  refreshOrgConfigs,
} from '@/js/store/projects/actions';
import { EPIC_STATUSES } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/js/store/actions');
jest.mock('@/js/store/projects/actions');

fetchObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
updateObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
createObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
refreshGitHubUsers.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
refreshOrgConfigs.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObject.mockClear();
  fetchObjects.mockClear();
  updateObject.mockClear();
  createObject.mockClear();
  refreshGitHubUsers.mockClear();
  refreshOrgConfigs.mockClear();
});

const defaultOrg = {
  id: 'org-id',
  epic: 'epic1',
  org_type: 'Playground',
  owner: 'user-id',
  owner_gh_username: 'currentUser',
  owner_gh_id: 'user-id',
  expires_at: '2019-09-16T12:58:53.721Z',
  latest_commit: '617a51',
  latest_commit_url: '/test/commit/url/',
  latest_commit_at: '2019-08-16T12:58:53.721Z',
  last_checked_unsaved_changes_at: new Date().toISOString(),
  url: '/test/org/url/',
  is_created: true,
  unsaved_changes: { Foo: ['Bar'] },
  has_unsaved_changes: true,
  total_unsaved_changes: 1,
  ignored_changes: {},
  has_ignored_changes: false,
  total_ignored_changes: 0,
  valid_target_directories: {
    source: ['src'],
    post: ['foo/bar', 'buz/baz'],
  },
  has_been_visited: true,
};

const epic = {
  id: 'epic1',
  slug: 'epic-1',
  name: 'Epic 1',
  github_users: ['123456', '234567', 'user-id', 'readonly'],
};

const defaultState = {
  projects: {
    projects: [
      {
        id: 'p1',
        name: 'Project 1',
        slug: 'project-1',
        old_slugs: [],
        description: 'This is a test project.',
        description_rendered: '<p>This is a test project.</p>',
        repo_url: 'https://github.com/test/test-repo',
        repo_owner: 'test',
        repo_name: 'test-repo',
        github_users: [
          {
            id: '123456',
            login: 'TestGitHubUser',
            permissions: {
              push: true,
            },
          },
          {
            id: '234567',
            login: 'OtherUser',
            permissions: {
              push: true,
            },
          },
          {
            id: '345678',
            login: 'ThirdUser',
            permissions: {
              push: true,
            },
          },
          {
            id: 'user-id',
            login: 'currentUser',
            permissions: { push: true },
          },
          {
            id: 'readonly',
            login: 'readonly-user',
            permissions: {
              push: false,
            },
          },
        ],
        has_push_permission: true,
      },
    ],
    notFound: ['different-project'],
    next: null,
  },
  epics: {
    p1: {
      epics: [
        {
          ...epic,
          project: 'p1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          branch_url: 'https://github.com/test/test-repo/tree/branch-name',
          branch_name: 'branch-name',
          old_slugs: ['old-slug'],
        },
      ],
      next: null,
      notFound: ['different-epic'],
      fetched: true,
    },
  },
  tasks: {
    p1: {
      fetched: ['epic1'],
      notFound: [],
      tasks: [
        {
          id: 'task1',
          name: 'Task 1',
          slug: 'task-1',
          epic,
          description: 'Task Description',
          description_rendered: '<p>Task Description</p>',
          branch_url: 'https://github.com/test/test-repo/tree/epic__task',
          branch_name: 'epic__task',
          review_valid: true,
          review_status: 'Approved',
          status: 'Completed',
        },
        {
          id: 'task2',
          name: 'Task 2',
          slug: 'task-2',
          epic,
          status: 'In progress',
          assigned_dev: '123456',
        },
        {
          id: 'task3',
          name: 'Task 3',
          slug: 'task-3',
          epic,
          status: 'Planned',
        },
        {
          id: 'task4',
          name: 'Task 4',
          slug: 'task-4',
          epic,
        },
        {
          id: 'task5',
          name: 'Task 5',
          slug: 'task-5',
          epic,
          status: 'In progress',
          review_valid: true,
          review_status: 'Changes requested',
        },
        {
          id: 'task6',
          name: 'Task 6',
          slug: 'task-6',
          epic,
          status: 'In progress',
          review_valid: true,
          review_status: 'Approved',
        },
        {
          id: 'task7',
          name: 'Task 7',
          slug: 'task-7',
          epic,
          status: 'In progress',
          pr_is_open: true,
        },
        {
          id: 'task8',
          name: 'Task 8',
          slug: 'task-8',
          epic,
          status: 'Canceled',
          pr_is_open: false,
        },
      ],
    },
  },
  orgs: {
    orgs: {
      [defaultOrg.id]: defaultOrg,
    },
    fetched: {
      projects: [],
      epics: ['epic1'],
      tasks: [],
    },
  },
  user: {
    id: 'user-id',
    username: 'currentUser',
    github_id: 'user-id',
    valid_token_for: 'my-org',
    is_devhub_enabled: true,
  },
};

describe('<EpicDetail/>', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      projectSlug: 'project-1',
      epicSlug: 'epic-1',
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, projectSlug, epicSlug } = opts;
    const context = {};
    const response = renderWithRedux(
      <StaticRouter context={context}>
        <EpicDetail match={{ params: { projectSlug, epicSlug } }} />
      </StaticRouter>,
      initialState,
      storeWithThunk,
    );
    return { ...response, context };
  };

  test('renders epic detail, scratch org, and tasks list', () => {
    const { getByText, getByTitle } = setup();

    expect(getByTitle('Epic 1')).toBeVisible();
    expect(getByText('Epic Scratch Org')).toBeVisible();
    expect(getByText('Epic Description')).toBeVisible();
    expect(getByText('Tasks for Epic 1')).toBeVisible();
    expect(getByText('Task 1')).toBeVisible();
    expect(getByText('Approved')).toBeVisible();
    expect(getByText('Changes Requested')).toBeVisible();
  });

  describe('readonly', () => {
    const projects = {
      ...defaultState.projects,
      projects: [
        {
          ...defaultState.projects.projects[0],
          has_push_permission: false,
        },
      ],
    };

    test('renders epic detail', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          projects,
        },
      });

      expect(getByText('Tasks for Epic 1')).toBeVisible();
      expect(getByText('Collaborators')).toBeVisible();
    });

    test('renders with no tasks/collaborators', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          projects,
          tasks: { p1: { ...defaultState.tasks.p1, tasks: [] } },
          epics: {
            p1: {
              ...defaultState.epics.p1,
              epics: [
                {
                  ...defaultState.epics.p1.epics[0],
                  github_users: [],
                },
              ],
            },
          },
        },
      });

      expect(getByText('No Tasks for Epic 1')).toBeVisible();
      expect(getByText('No Collaborators')).toBeVisible();
    });

    test('can self-assign readonly user to task', () => {
      const { getAllByText } = setup({
        initialState: {
          ...defaultState,
          projects,
        },
      });
      fireEvent.click(getAllByText('Self-Assign as Tester')[0]);

      expect(updateObject).toHaveBeenCalled();

      const data = updateObject.mock.calls[0][0].data;

      expect(data.assigned_qa).toEqual('user-id');
      expect(data.should_alert_qa).toBe(false);
    });
  });

  test('renders different title if no tasks', () => {
    const { getByText, queryByText } = setup({
      initialState: {
        ...defaultState,
        tasks: { p1: { ...defaultState.tasks.p1, tasks: [] } },
      },
    });

    expect(getByText('Create a Task for Epic 1')).toBeVisible();
    expect(queryByText('Tasks for Epic 1')).toBeNull();
  });

  describe('epic not found', () => {
    test('fetches epic from API', () => {
      const { queryByText } = setup({ epicSlug: 'other-epic' });

      expect(queryByText('Epic 1')).toBeNull();
      expect(fetchObject).toHaveBeenCalledWith({
        filters: { project: 'p1', slug: 'other-epic' },
        objectType: 'epic',
      });
    });
  });

  describe('project does not exist', () => {
    test('renders <ProjectNotFound />', () => {
      const { getByText, queryByText } = setup({
        projectSlug: 'different-project',
      });

      expect(queryByText('Epic 1')).toBeNull();
      expect(getByText('list of all Projects')).toBeVisible();
    });
  });

  describe('epic does not exist', () => {
    test('renders <EpicNotFound />', () => {
      const { getByText, queryByText } = setup({
        epicSlug: 'different-epic',
      });

      expect(queryByText('Epic 1')).toBeNull();
      expect(getByText('another Epic')).toBeVisible();
    });
  });

  describe('old epic slug', () => {
    test('redirects to epic_detail with new slug', () => {
      const { context } = setup({ epicSlug: 'old-slug' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(routes.epic_detail('project-1', 'epic-1'));
    });
  });

  describe('orgs have not been fetched', () => {
    test('fetches orgs from API', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          orgs: {
            orgs: {},
            fetched: {
              projects: [],
              epics: [],
              tasks: [],
            },
          },
        },
      });

      expect(queryByText('Epic Scratch Org')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { epic: 'epic1' },
        objectType: 'scratch_org',
      });
    });
  });

  describe('tasks have not been fetched', () => {
    test('fetches tasks from API', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {},
        },
      });

      expect(queryByText('Tasks for Epic 1')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { project: 'p1', epic: 'epic1' },
        objectType: 'task',
      });
    });
  });

  describe('only some tasks have been fetched', () => {
    test('fetches all epic tasks from API', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            p1: {
              ...defaultState.tasks.p1,
              fetched: [],
            },
          },
        },
      });

      expect(queryByText('Tasks for Epic 1')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { project: 'p1', epic: 'epic1' },
        objectType: 'task',
      });
    });
  });

  describe('<AssignEpicCollaboratorsModal />', () => {
    test('opens and closes', () => {
      const { getByText, getByTitle, queryByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            p1: {
              ...defaultState.epics.p1,
              epics: [
                {
                  ...defaultState.epics.p1.epics[0],
                  github_users: [],
                },
              ],
            },
          },
        },
      });
      fireEvent.click(getByText('Add or Remove Collaborators'));

      expect(getByText('GitHub Collaborators')).toBeVisible();

      fireEvent.click(getByTitle('Cancel'));

      expect(queryByText('GitHub Collaborators')).toBeNull();
    });

    test('updates users', () => {
      const { getByText, baseElement } = setup();
      fireEvent.click(getByText('Add or Remove Collaborators'));
      fireEvent.click(
        baseElement.querySelector('.collaborator-button[title="OtherUser"]'),
      );
      fireEvent.click(
        baseElement.querySelector('.collaborator-button[title="ThirdUser"]'),
      );
      fireEvent.click(getByText('Save'));

      expect(updateObject).toHaveBeenCalled();
      expect(updateObject.mock.calls[0][0].data.github_users).toEqual([
        'user-id',
        'readonly',
        '123456',
        '345678',
      ]);
    });

    test('opens confirm modal if removing assigned user', () => {
      const { getByText, baseElement } = setup();
      fireEvent.click(getByText('Add or Remove Collaborators'));
      fireEvent.click(
        baseElement.querySelector(
          '.collaborator-button[title="TestGitHubUser"]',
        ),
      );
      fireEvent.click(getByText('Save'));

      expect(updateObject).not.toHaveBeenCalled();
      expect(getByText('Confirm Removing Collaborator')).toBeVisible();
    });

    describe('"re-sync collaborators" click', () => {
      test('updates users', () => {
        const { getByText } = setup();
        fireEvent.click(getByText('Add or Remove Collaborators'));
        fireEvent.click(getByText('Re-Sync GitHub Collaborators'));

        expect(refreshGitHubUsers).toHaveBeenCalledWith('p1');
      });
    });
  });

  describe('removeEpicUser', () => {
    test('removes user from epic', () => {
      const { getByTitle } = setup({
        initialState: {
          ...defaultState,
          epics: {
            p1: {
              ...defaultState.epics.p1,
              epics: [
                {
                  ...defaultState.epics.p1.epics[0],
                  github_users: ['234567'],
                },
              ],
            },
          },
        },
      });
      fireEvent.click(getByTitle('Remove'));

      expect(updateObject).toHaveBeenCalled();
      expect(updateObject.mock.calls[0][0].data.github_users).toEqual([]);
    });

    test('opens confirm modal if removing assigned user', () => {
      const { getByTitle, getByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            p1: {
              ...defaultState.epics.p1,
              epics: [
                {
                  ...defaultState.epics.p1.epics[0],
                  github_users: ['123456'],
                },
              ],
            },
          },
        },
      });
      fireEvent.click(getByTitle('Remove'));

      expect(updateObject).not.toHaveBeenCalled();
      expect(getByText('Confirm Removing Collaborator')).toBeVisible();
    });
  });

  describe('<ConfirmRemoveUserModal />', () => {
    let result;

    beforeEach(() => {
      const task = {
        ...defaultState.tasks.p1.tasks[0],
        assigned_qa: '234567',
      };
      result = setup({
        initialState: {
          ...defaultState,
          tasks: {
            p1: {
              ...defaultState.tasks.p1,
              tasks: [task, defaultState.tasks.p1.tasks[1]],
            },
          },
        },
      });
      fireEvent.click(result.getByText('Add or Remove Collaborators'));
      fireEvent.click(
        result.baseElement.querySelector(
          '.collaborator-button[title="TestGitHubUser"]',
        ),
      );
      fireEvent.click(
        result.baseElement.querySelector(
          '.collaborator-button[title="OtherUser"]',
        ),
      );
      fireEvent.click(result.getByText('Save'));
    });

    describe('"cancel" click', () => {
      test('closes modal', () => {
        const { getByTitle, queryByText } = result;
        fireEvent.click(getByTitle('Cancel'));

        expect(queryByText('Confirm Removing Collaborators')).toBeNull();
      });
    });

    describe('"confirm" click', () => {
      test('removes user', () => {
        const { getByText, queryByText } = result;
        fireEvent.click(getByText('Confirm'));

        expect(queryByText('Confirm Removing Collaborators')).toBeNull();
        expect(updateObject).toHaveBeenCalled();
        expect(updateObject.mock.calls[0][0].data.github_users).toEqual([
          'user-id',
          'readonly',
        ]);
      });
    });
  });

  describe('task assignUser', () => {
    test('updates task assigned user', () => {
      const { getAllByText, baseElement, getByText } = setup();
      fireEvent.click(getAllByText('Assign Tester')[0]);
      fireEvent.click(
        baseElement.querySelector('.collaborator-button[title="currentUser"]'),
      );
      fireEvent.click(getByText('Save'));

      expect(updateObject).toHaveBeenCalled();

      const data = updateObject.mock.calls[0][0].data;

      expect(data.assigned_qa).toEqual('user-id');
      expect(data.should_alert_qa).toBe(false);
    });

    describe('alerts assigned user', () => {
      test('assigning tester', () => {
        const { getAllByText, baseElement, getByText } = setup();
        fireEvent.click(getAllByText('Assign Tester')[0]);
        fireEvent.click(
          baseElement.querySelector('.collaborator-button[title="OtherUser"]'),
        );
        fireEvent.click(getByText('Notify Assigned Tester by Email'));
        fireEvent.click(getByText('Save'));

        expect(updateObject.mock.calls[0][0].data.should_alert_qa).toBe(false);
      });

      test('does not auto toggle when assigning user (developer)', () => {
        const { getAllByText, baseElement, getByText } = setup();
        fireEvent.click(getAllByText('Assign Developer')[0]);
        fireEvent.click(getByText('Notify Assigned Developer by Email'));
        fireEvent.click(
          baseElement.querySelector('.collaborator-button[title="OtherUser"]'),
        );
        fireEvent.click(getByText('Save'));

        expect(updateObject.mock.calls[0][0].data.should_alert_dev).toBe(false);
      });
    });
  });

  describe('"Submit Epic for Review on GitHub" click', () => {
    test('opens modal', () => {
      const { getByText, getAllByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            p1: {
              ...defaultState.epics.p1,
              epics: [
                {
                  ...defaultState.epics.p1.epics[0],
                  has_unmerged_commits: true,
                },
              ],
            },
          },
        },
      });
      fireEvent.click(getByText('Submit Epic for Review on GitHub'));

      getAllByText('Submit Epic for Review on GitHub').forEach((element) => {
        expect(element).toBeVisible();
      });
    });
  });

  describe('"Submit this Epic for review on GitHub" step click', () => {
    test('opens modal', () => {
      const { getByText, getByLabelText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            p1: {
              ...defaultState.epics.p1,
              epics: [
                {
                  ...defaultState.epics.p1.epics[0],
                  has_unmerged_commits: true,
                },
              ],
            },
          },
        },
      });
      fireEvent.click(getByText('Submit this Epic for review on GitHub'));

      expect(getByLabelText('Developer notes')).toBeVisible();
    });
  });

  describe('submitting epic for review', () => {
    test('renders loading button', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            p1: {
              ...defaultState.epics.p1,
              epics: [
                {
                  ...defaultState.epics.p1.epics[0],
                  has_unmerged_commits: true,
                  currently_creating_pr: true,
                },
              ],
            },
          },
        },
      });

      expect(getByText('Submitting Epic for Review on GitHub…')).toBeVisible();
    });

    test('renders view pr button if pr_url exists', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            p1: {
              ...defaultState.epics.p1,
              epics: [
                {
                  ...defaultState.epics.p1.epics[0],
                  pr_url: 'https://example.com/',
                  pr_is_open: true,
                },
              ],
            },
          },
        },
      });

      expect(getByText('View Pull Request')).toBeVisible();
    });

    test('renders view branch button if branch_url exists', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            p1: {
              ...defaultState.epics.p1,
              epics: [
                {
                  ...defaultState.epics.p1.epics[0],
                  branch_url: 'https://example.com/',
                },
              ],
            },
          },
        },
      });

      expect(getByText('View Branch')).toBeVisible();
    });
  });

  describe('epic options click', () => {
    test('opens and closes edit modal', () => {
      const { getByText, getByTitle, queryByText } = setup();
      fireEvent.click(getByText('Epic Options'));
      fireEvent.click(getByText('Edit Epic'));

      expect(getByText('Edit Epic')).toBeVisible();

      fireEvent.click(getByTitle('Cancel'));

      expect(queryByText('Edit Epic')).toBeNull();
    });

    test('opens and closes delete modal', () => {
      const { getByText, getByTitle, queryByText } = setup();
      fireEvent.click(getByText('Epic Options'));
      fireEvent.click(getByText('Delete Epic'));

      expect(getByText('Confirm Deleting Epic')).toBeVisible();

      fireEvent.click(getByTitle('Cancel'));

      expect(queryByText('Confirm Deleting Epic')).toBeNull();
    });
  });

  describe('<CreateTaskModal/>', () => {
    test('open/close modal', () => {
      const { queryByText, getByText, getAllByText, getByTitle } = setup();
      fireEvent.click(getAllByText('Create a Task')[1]);

      expect(getByText('Create a Task for Epic 1')).toBeVisible();

      fireEvent.click(getByTitle('Cancel'));

      expect(queryByText('Create a Task for Epic 1')).toBeNull();
    });
  });

  describe('<CreateOrgModal />', () => {
    let result;

    beforeEach(() => {
      result = setup({
        initialState: {
          ...defaultState,
          orgs: {
            orgs: {},
            fetched: {
              projects: [],
              epics: ['epic1'],
              tasks: [],
            },
          },
        },
      });
      fireEvent.click(result.getByText('Create Scratch Org'));
    });

    describe('"cancel" click', () => {
      test('closes modal', () => {
        const { getByText, queryByText } = result;

        expect(
          getByText('You are creating a Scratch Org', { exact: false }),
        ).toBeVisible();

        fireEvent.click(getByText('Cancel'));

        expect(
          queryByText('You are creating a Scratch Org', { exact: false }),
        ).toBeNull();
      });
    });

    describe('"Create Org" click', () => {
      test('creates scratch org', async () => {
        const { getByText, queryByText } = result;

        expect.assertions(5);
        fireEvent.click(getByText('Next'));

        expect(getByText('Advanced Options')).toBeVisible();

        fireEvent.click(getByText('Create Org'));
        await waitForElementToBeRemoved(getByText('Advanced Options'));

        expect(queryByText('Advanced Options')).toBeNull();
        expect(createObject).toHaveBeenCalled();
        expect(createObject.mock.calls[0][0].data.epic).toEqual('epic1');
        expect(createObject.mock.calls[0][0].data.org_config_name).toEqual(
          'dev',
        );
      });
    });
  });

  describe('<ContributeWorkModal />', () => {
    describe('"cancel" click', () => {
      test('closes modal', () => {
        const { getByText, queryByText } = setup();
        fireEvent.click(getByText('Contribute Work'));

        expect(getByText('Contribute Work from Scratch Org')).toBeVisible();

        fireEvent.click(getByText('Cancel'));

        expect(queryByText('Contribute Work from Scratch Org')).toBeNull();
      });
    });

    describe('"Contribute" click', () => {
      test('opens Create Task modal', () => {
        const { getByText } = setup();
        fireEvent.click(getByText('Contribute Work'));
        fireEvent.click(getByText('Contribute'));

        expect(
          getByText('Create a Task to Contribute Work from Scratch Org'),
        ).toBeVisible();
      });
    });

    describe('Epic is already merged', () => {
      test('does not allow contributing', () => {
        const { queryByText } = setup({
          initialState: {
            ...defaultState,
            epics: {
              p1: {
                ...defaultState.epics.p1,
                epics: [
                  {
                    ...defaultState.epics.p1.epics[0],
                    status: EPIC_STATUSES.MERGED,
                  },
                ],
              },
            },
          },
        });

        expect(queryByText('Contribute Work')).toBeNull();
      });
    });

    describe('User does not have permissions', () => {
      test('does not allow contributing', () => {
        const projects = {
          ...defaultState.projects,
          projects: [
            {
              ...defaultState.projects.projects[0],
              has_push_permission: false,
            },
          ],
        };
        const { getByText } = setup({
          initialState: {
            ...defaultState,
            projects,
          },
        });
        fireEvent.click(getByText('Contribute Work'));

        expect(getByText('Contribute Work from Scratch Org')).toBeVisible();
        expect(
          getByText('You do not have “push” access', { exact: false }),
        ).toBeVisible();
      });
    });
  });
});
