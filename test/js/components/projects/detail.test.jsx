import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import ProjectDetail from '@/components/projects/detail';
import { fetchObject, fetchObjects, updateObject } from '@/store/actions';
import { refreshGitHubUsers } from '@/store/repositories/actions';
import routes from '@/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');
jest.mock('@/store/repositories/actions');

fetchObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
updateObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
refreshGitHubUsers.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObject.mockClear();
  fetchObjects.mockClear();
  updateObject.mockClear();
  refreshGitHubUsers.mockClear();
});

const defaultState = {
  repositories: {
    repositories: [
      {
        id: 'r1',
        name: 'Repository 1',
        slug: 'repository-1',
        old_slugs: [],
        description_rendered: 'This is a test repository.',
        repo_url: 'https://github.com/test/test-repo',
        github_users: [
          {
            id: '123456',
            login: 'TestGitHubUser',
          },
          {
            id: '234567',
            login: 'OtherUser',
          },
          {
            id: '345678',
            login: 'ThirdUser',
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
          description_rendered: 'Project Description',
          old_slugs: ['old-slug'],
          github_users: [
            {
              id: '123456',
              login: 'TestGitHubUser',
            },
            {
              id: '234567',
              login: 'OtherUser',
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
        project: 'project1',
        description_rendered: 'Task Description',
        review_valid: true,
        review_status: 'Approved',
        status: 'Completed',
      },
      {
        id: 'task2',
        name: 'Task 2',
        slug: 'task-2',
        project: 'project1',
        status: 'In progress',
        assigned_dev: {
          id: '123456',
          login: 'TestGitHubUser',
          avatar_url: 'https://example.com/avatar.png',
        },
      },
      {
        id: 'task3',
        name: 'Task 3',
        slug: 'task-3',
        project: 'project1',
        status: 'Planned',
      },
      {
        id: 'task4',
        name: 'Task 4',
        slug: 'task-4',
        project: 'project1',
      },
      {
        id: 'task5',
        name: 'Task 5',
        slug: 'task-5',
        project: 'project1',
        review_valid: true,
        review_status: 'Changes requested',
      },
      {
        id: 'task6',
        name: 'Task 6',
        slug: 'task-6',
        project: 'project1',
        review_valid: true,
        review_status: 'Approved',
      },
    ],
  },
};

describe('<ProjectDetail/>', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      repositorySlug: 'repository-1',
      projectSlug: 'project-1',
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, repositorySlug, projectSlug } = opts;
    const context = {};
    const response = renderWithRedux(
      <StaticRouter context={context}>
        <ProjectDetail match={{ params: { repositorySlug, projectSlug } }} />
      </StaticRouter>,
      initialState,
      storeWithThunk,
    );
    return { ...response, context };
  };

  test('renders project detail and tasks list', () => {
    const { getByText, getByTitle } = setup();

    expect(getByTitle('Project 1')).toBeVisible();
    expect(getByText('Project Description')).toBeVisible();
    expect(getByText('Tasks for Project 1')).toBeVisible();
    expect(getByText('Task 1')).toBeVisible();
    expect(getByText('Approved')).toBeVisible();
    expect(getByText('Changes Requested')).toBeVisible();
  });

  test('renders with form expanded if no tasks', () => {
    const { getByText, queryByText } = setup({
      initialState: {
        ...defaultState,
        tasks: { project1: [] },
      },
    });

    expect(getByText('Add a Task for Project 1')).toBeVisible();
    expect(queryByText('Tasks for Project 1')).toBeNull();
  });

  describe('project not found', () => {
    test('fetches project from API', () => {
      const { queryByText } = setup({ projectSlug: 'other-project' });

      expect(queryByText('Project 1')).toBeNull();
      expect(fetchObject).toHaveBeenCalledWith({
        filters: { repository: 'r1', slug: 'other-project' },
        objectType: 'project',
      });
    });
  });

  describe('repository does not exist', () => {
    test('renders <RepositoryNotFound />', () => {
      const { getByText, queryByText } = setup({
        repositorySlug: 'different-repository',
      });

      expect(queryByText('Project 1')).toBeNull();
      expect(getByText('list of all repositories')).toBeVisible();
    });
  });

  describe('project does not exist', () => {
    test('renders <ProjectNotFound />', () => {
      const { getByText, queryByText } = setup({
        projectSlug: 'different-project',
      });

      expect(queryByText('Project 1')).toBeNull();
      expect(getByText('another project')).toBeVisible();
    });
  });

  describe('old project slug', () => {
    test('redirects to project_detail with new slug', () => {
      const { context } = setup({ projectSlug: 'old-slug' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(
        routes.project_detail('repository-1', 'project-1'),
      );
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

      expect(queryByText('Tasks for Project 1')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { project: 'project1' },
        objectType: 'task',
      });
    });
  });

  describe('<AssignUsersModal />', () => {
    test('opens and closes', () => {
      const { getByText, queryByText } = setup();
      fireEvent.click(getByText('Add or Remove Collaborators'));

      expect(getByText('GitHub Users')).toBeVisible();

      fireEvent.click(getByText('Cancel'));

      expect(queryByText('GitHub Users')).toBeNull();
    });

    test('updates users', () => {
      const { getByText, baseElement } = setup();
      fireEvent.click(getByText('Add or Remove Collaborators'));
      fireEvent.click(
        baseElement.querySelector(
          '.collaborator-button[title="TestGitHubUser"]',
        ),
      );
      fireEvent.click(
        baseElement.querySelector('.collaborator-button[title="ThirdUser"]'),
      );
      fireEvent.click(getByText('Save'));

      expect(updateObject).toHaveBeenCalled();
      expect(
        updateObject.mock.calls[0][0].data.github_users.map((u) => u.login),
      ).toEqual(['OtherUser', 'ThirdUser']);
    });

    describe('"re-sync collaborators" click', () => {
      test('updates users', () => {
        const { getByText } = setup();
        fireEvent.click(getByText('Add or Remove Collaborators'));
        fireEvent.click(getByText('Re-Sync Collaborators'));

        expect(refreshGitHubUsers).toHaveBeenCalledWith('r1');
      });
    });
  });

  describe('removeProjectUser', () => {
    test('removes user from project', () => {
      const { getByTitle } = setup({
        initialState: {
          ...defaultState,
          projects: {
            r1: {
              ...defaultState.projects.r1,
              projects: [
                {
                  ...defaultState.projects.r1.projects[0],
                  github_users: [
                    {
                      id: '123456',
                      login: 'TestGitHubUser',
                      avatar_url: 'https://example.com/avatar.png',
                    },
                  ],
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
  });

  describe('task assignUser', () => {
    test('updates task assigned user', () => {
      const { getAllByText, baseElement } = setup();
      fireEvent.click(getAllByText('Assign Reviewer')[0]);
      fireEvent.click(
        baseElement.querySelector('.collaborator-button[title="OtherUser"]'),
      );

      expect(updateObject).toHaveBeenCalled();
      expect(updateObject.mock.calls[0][0].data.assigned_qa.login).toEqual(
        'OtherUser',
      );
    });

    test('closes modal if no users to assign', () => {
      const { getByText, getAllByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            r1: {
              ...defaultState.projects.r1,
              projects: [
                {
                  ...defaultState.projects.r1.projects[0],
                  github_users: [],
                },
              ],
            },
          },
        },
      });
      fireEvent.click(getAllByText('Assign Reviewer')[0]);
      fireEvent.click(getByText('Add collaborators to the project'));

      expect(getByText('GitHub Users')).toBeVisible();
    });
  });

  describe('"Submit Project for Review" click', () => {
    test('opens modal', () => {
      const { getByText, getAllByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            r1: {
              ...defaultState.projects.r1,
              projects: [
                {
                  ...defaultState.projects.r1.projects[0],
                  has_unmerged_commits: true,
                },
              ],
            },
          },
        },
      });
      fireEvent.click(getByText('Submit Project for Review'));

      getAllByText('Submit Project for Review').forEach((element) => {
        expect(element).toBeVisible();
      });
    });
  });

  describe('submitting project for review', () => {
    test('renders loading button', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            r1: {
              ...defaultState.projects.r1,
              projects: [
                {
                  ...defaultState.projects.r1.projects[0],
                  has_unmerged_commits: true,
                  currently_creating_pr: true,
                },
              ],
            },
          },
        },
      });

      expect(getByText('Submitting Project for Review…')).toBeVisible();
    });

    test('renders view pr button if pr_url exists', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            r1: {
              ...defaultState.projects.r1,
              projects: [
                {
                  ...defaultState.projects.r1.projects[0],
                  pr_url: 'https://example.com/',
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
          projects: {
            r1: {
              ...defaultState.projects.r1,
              projects: [
                {
                  ...defaultState.projects.r1.projects[0],
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

  describe('editing project click', () => {
    test('opens opens and closes modal', () => {
      const { baseElement, getByText, queryByText } = setup();
      fireEvent.click(baseElement.querySelector('#projectOptions'));
      fireEvent.click(getByText('Edit Project'));

      expect(getByText('Edit Project')).toBeVisible();

      fireEvent.click(getByText('Cancel'));

      expect(queryByText('Edit Project')).toBeNull();
    });
  });
});
