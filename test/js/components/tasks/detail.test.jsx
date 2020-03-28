import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import TaskDetail from '@/components/tasks/detail';
import { fetchObjects } from '@/store/actions';
import { refetchOrg } from '@/store/orgs/actions';
import routes from '@/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');
jest.mock('@/store/orgs/actions');

fetchObjects.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
refetchOrg.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  fetchObjects.mockClear();
  refetchOrg.mockClear();
});

const defaultState = {
  user: {
    id: 'user-id',
    username: 'user-name',
    valid_token_for: 'my-org',
    is_devhub_enabled: true,
  },
  repositories: {
    repositories: [
      {
        id: 'r1',
        name: 'Repository 1',
        slug: 'repository-1',
        old_slugs: [],
        description: 'This is a test repository.',
        description_rendered: '<p>This is a test repository.</p>',
        repo_url: 'https://github.com/test/test-repo',
        github_users: [
          {
            id: 'user-1',
            login: 'user-name',
          },
        ],
      },
    ],
    notFound: ['different-repository'],
    next: null,
  },
  projects: {
    r1: {
      projects: [
        {
          id: 'project1',
          slug: 'project-1',
          name: 'Project 1',
          repository: 'r1',
          description: 'Project Description',
          description_rendered: '<p>Project Description</p>',
          old_slugs: [],
          github_users: [
            {
              id: 'user-1',
              login: 'user-name',
            },
          ],
        },
      ],
      next: null,
      notFound: ['different-project'],
      fetched: true,
    },
  },
  tasks: {
    project1: [
      {
        id: 'task1',
        name: 'Task 1',
        slug: 'task-1',
        old_slugs: ['old-slug'],
        project: 'project1',
        description: 'Task Description',
        description_rendered: '<p>Task Description</p>',
        has_unmerged_commits: false,
        commits: [],
        assigned_dev: {
          login: 'user-name',
        },
        assigned_qa: null,
      },
    ],
  },
  orgs: {
    task1: {
      Dev: {
        id: 'org-id',
        task: 'task1',
        org_type: 'Dev',
        owner: 'user-id',
        owner_gh_username: 'user-name',
        expires_at: '2019-09-16T12:58:53.721Z',
        latest_commit: '617a51',
        latest_commit_url: '/test/commit/url/',
        latest_commit_at: '2019-08-16T12:58:53.721Z',
        last_checked_unsaved_changes_at: new Date().toISOString(),
        url: '/test/org/url/',
        unsaved_changes: { Foo: ['Bar'] },
        has_unsaved_changes: true,
        valid_target_directories: {
          source: ['src'],
          post: ['foo/bar', 'buz/baz'],
        },
      },
      QA: null,
    },
  },
};

describe('<TaskDetail/>', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      repositorySlug: 'repository-1',
      projectSlug: 'project-1',
      taskSlug: 'task-1',
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, repositorySlug, projectSlug, taskSlug } = opts;
    const context = {};
    const result = renderWithRedux(
      <StaticRouter context={context}>
        <TaskDetail
          match={{ params: { repositorySlug, projectSlug, taskSlug } }}
        />
      </StaticRouter>,
      initialState,
      storeWithThunk,
    );
    return { ...result, context };
  };

  test('renders task detail with org', () => {
    const { getByText, getByTitle, queryByText } = setup();

    expect(getByTitle('Task 1')).toBeVisible();
    expect(getByText('Task Description')).toBeVisible();
    expect(queryByText('View Branch')).toBeNull();
    expect(getByTitle('View Org')).toBeVisible();
    expect(getByText('Task Team & Orgs')).toBeVisible();
  });

  test('renders view changes if has_unmerged_commits, branch_diff_url', () => {
    const { getByText, getByTitle } = setup({
      initialState: {
        ...defaultState,
        tasks: {
          ...defaultState.tasks,
          project1: [
            {
              ...defaultState.tasks.project1[0],
              branch_diff_url: 'https://github.com/example/repo',
              has_unmerged_commits: true,
            },
          ],
        },
      },
    });

    expect(getByTitle('Task 1')).toBeVisible();
    expect(getByText('View Changes')).toBeVisible();
  });

  test('renders view pr button if pr_url exists', () => {
    const { getByText, getByTitle } = setup({
      initialState: {
        ...defaultState,
        tasks: {
          ...defaultState.tasks,
          project1: [
            {
              ...defaultState.tasks.project1[0],
              pr_url: 'my-pr-url',
            },
          ],
        },
      },
    });

    expect(getByTitle('Task 1')).toBeVisible();
    expect(getByText('View Pull Request')).toBeVisible();
  });

  describe('tasks not found', () => {
    test('fetches tasks from API', () => {
      const { queryByText } = setup({
        initialState: { ...defaultState, tasks: {} },
      });

      expect(queryByText('Task 1')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { project: 'project1' },
        objectType: 'task',
      });
    });
  });

  describe('repository does not exist', () => {
    test('renders <RepositoryNotFound />', () => {
      const { getByText, queryByText } = setup({
        repositorySlug: 'different-repository',
      });

      expect(queryByText('Task 1')).toBeNull();
      expect(getByText('list of all repositories')).toBeVisible();
    });
  });

  describe('project does not exist', () => {
    test('renders <ProjectNotFound />', () => {
      const { getByText, queryByText } = setup({
        projectSlug: 'different-project',
      });

      expect(queryByText('Task 1')).toBeNull();
      expect(getByText('another project')).toBeVisible();
    });
  });

  describe('task does not exist', () => {
    test('renders <TaskNotFound />', () => {
      const { getByText, queryByText } = setup({
        taskSlug: 'different-task',
      });

      expect(queryByText('Task 1')).toBeNull();
      expect(getByText('another task')).toBeVisible();
    });
  });

  describe('old task slug', () => {
    test('redirects to task_detail with new slug', () => {
      const { context } = setup({ taskSlug: 'old-slug' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(
        routes.task_detail('repository-1', 'project-1', 'task-1'),
      );
    });
  });

  describe('orgs have not been fetched', () => {
    test('fetches orgs from API', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          orgs: {},
        },
      });

      expect(queryByText('Task Team & Orgs')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledTimes(1);
      expect(fetchObjects).toHaveBeenCalledWith({
        objectType: 'scratch_org',
        filters: { task: 'task1' },
      });
    });
  });

  describe('"Retrieve Changes from Dev Org" click', () => {
    test('refreshes and then opens modal', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Retrieve Changes from Dev Org'));

      expect(refetchOrg).toHaveBeenCalledTimes(1);

      const refetchArgs = refetchOrg.mock.calls[0][0];

      expect(refetchArgs.id).toEqual('org-id');

      expect(
        getByText('Select the location to retrieve changes'),
      ).toBeVisible();
    });

    describe('org has been checked within past 5 minutes', () => {
      let ORG_RECHECK_MINUTES;

      beforeAll(() => {
        ORG_RECHECK_MINUTES = window.GLOBALS.ORG_RECHECK_MINUTES;
        window.GLOBALS.ORG_RECHECK_MINUTES = 5;
      });

      afterAll(() => {
        window.GLOBALS.ORG_RECHECK_MINUTES = ORG_RECHECK_MINUTES;
      });

      test('just opens modal', () => {
        const { getByText } = setup();
        fireEvent.click(getByText('Retrieve Changes from Dev Org'));

        expect(refetchOrg).not.toHaveBeenCalled();
        expect(
          getByText('Select the location to retrieve changes'),
        ).toBeVisible();
      });
    });
  });

  describe('commiting changes', () => {
    test('renders loading button', () => {
      const { getAllByText } = setup({
        initialState: {
          ...defaultState,
          orgs: {
            ...defaultState.orgs,
            task1: {
              ...defaultState.orgs.task1,
              Dev: {
                ...defaultState.orgs.task1.Dev,
                currently_capturing_changes: true,
              },
            },
          },
        },
      });

      expect(getAllByText('Retrieving Selected Changes…')).toHaveLength(2);
    });
  });

  describe('pr is closed', () => {
    test('renders "Submit Task for Testing" button', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            ...defaultState.tasks,
            project1: [
              {
                ...defaultState.tasks.project1[0],
                has_unmerged_commits: true,
                pr_url: 'my-pr-url',
                pr_is_open: false,
              },
            ],
          },
        },
      });

      expect(getByText('Submit Task for Testing')).toBeVisible();
    });
  });

  describe('pr is open', () => {
    test('does not render "Submit Task for Testing" button', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            ...defaultState.tasks,
            project1: [
              {
                ...defaultState.tasks.project1[0],
                has_unmerged_commits: true,
                pr_url: 'my-pr-url',
                pr_is_open: true,
                review_valid: true,
              },
            ],
          },
        },
      });

      expect(queryByText('Submit Task for Testing')).toBeNull();
    });
  });

  describe('"Submit Task for Testing" click', () => {
    test('opens modal', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            ...defaultState.tasks,
            project1: [
              {
                ...defaultState.tasks.project1[0],
                has_unmerged_commits: true,
              },
            ],
          },
        },
      });
      fireEvent.click(getByText('Submit Task for Testing'));

      expect(getByText('Submit this task for testing')).toBeVisible();
    });
  });

  describe('submitting task for testing', () => {
    test('renders loading button', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            ...defaultState.tasks,
            project1: [
              {
                ...defaultState.tasks.project1[0],
                has_unmerged_commits: true,
                currently_creating_pr: true,
              },
            ],
          },
        },
      });

      expect(getByText('Submitting Task for Testing…')).toBeVisible();
    });
  });

  test('renders loading button in primary position', () => {
    const { getByText } = setup({
      initialState: {
        ...defaultState,
        tasks: {
          ...defaultState.tasks,
          project1: [
            {
              ...defaultState.tasks.project1[0],
              has_unmerged_commits: true,
              currently_creating_pr: true,
            },
          ],
        },
        orgs: {
          ...defaultState.orgs,
          task1: {
            ...defaultState.orgs.task1,
            Dev: {
              ...defaultState.orgs.task1.Dev,
              has_unsaved_changes: false,
            },
          },
        },
      },
    });

    expect(getByText('Submitting Task for Testing…')).toBeVisible();
  });

  describe('edit task click', () => {
    test('opens and closes modal', () => {
      const { getByText, queryByText } = setup();
      fireEvent.click(getByText('Task Options'));
      fireEvent.click(getByText('Edit Task'));

      expect(getByText('Edit Task')).toBeVisible();

      fireEvent.click(getByText('Cancel'));

      expect(queryByText('Edit Task')).toBeNull();
    });
  });
});
