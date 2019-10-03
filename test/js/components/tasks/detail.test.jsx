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
        repo_url: 'https://www.github.com/test/test-repo',
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
          old_slugs: [],
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
        expires_at: '2019-09-16T12:58:53.721Z',
        latest_commit: '617a51',
        latest_commit_url: '/test/commit/url/',
        latest_commit_at: '2019-08-16T12:58:53.721Z',
        url: '/test/org/url/',
        unsaved_changes: { Foo: ['Bar'] },
        has_unsaved_changes: true,
      },
      QA: null,
    },
  },
};

describe('<TaskDetail/>', () => {
  const setup = options => {
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
    expect(getByText('Task Orgs')).toBeVisible();
  });

  test('renders view branch button if branch_url exists', () => {
    const { getByText, getByTitle } = setup({
      initialState: {
        ...defaultState,
        tasks: {
          ...defaultState.tasks,
          project1: [
            {
              ...defaultState.tasks.project1[0],
              branch_url: 'my-url',
            },
          ],
        },
      },
    });

    expect(getByTitle('Task 1')).toBeVisible();
    expect(getByText('View Branch')).toBeVisible();
    expect(getByText('Task Description')).toBeVisible();
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

      expect(queryByText('Task Orgs')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledTimes(1);

      const args = fetchObjects.mock.calls[0][0];

      expect(args.objectType).toEqual('scratch_org');
      expect(args.filters).toEqual({ task: 'task1' });
      expect(args.shouldSubscribeToObject({})).toBe(false);
      expect(args.shouldSubscribeToObject({ owner: 'user-id' })).toBe(true);
    });
  });

  describe('"Capture Task Changes" click', () => {
    test('refreshes and then opens modal', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Capture Task Changes'));

      expect(refetchOrg).toHaveBeenCalledTimes(1);

      const refetchArgs = refetchOrg.mock.calls[0][0];

      expect(refetchArgs.id).toEqual('org-id');

      expect(getByText('Select the changes to capture')).toBeVisible();
    });

    describe('not connected to sf org', () => {
      test('opens connect modal', () => {
        const { getByText } = setup({
          initialState: {
            ...defaultState,
            user: { ...defaultState.user, valid_token_for: null },
          },
        });
        fireEvent.click(getByText('Capture Task Changes'));

        expect(refetchOrg).not.toHaveBeenCalled();
        expect(getByText('Use Custom Domain')).toBeVisible();
      });
    });

    describe('dev hub not enabled', () => {
      test('opens warning modal', () => {
        const { getByText } = setup({
          initialState: {
            ...defaultState,
            user: { ...defaultState.user, is_devhub_enabled: false },
          },
        });
        fireEvent.click(getByText('Capture Task Changes'));

        expect(refetchOrg).not.toHaveBeenCalled();
        expect(getByText('Enable Dev Hub')).toBeVisible();
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
              committing: true,
            },
          },
        },
      });

      expect(getAllByText('Capturing Selected Changes…').length).toEqual(2);
    });
  });
});
