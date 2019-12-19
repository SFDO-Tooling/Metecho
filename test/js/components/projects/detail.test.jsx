import React from 'react';
import { StaticRouter } from 'react-router-dom';

import ProjectDetail from '@/components/projects/detail';
import { fetchObject, fetchObjects } from '@/store/actions';
import routes from '@/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');

fetchObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObject.mockClear();
  fetchObjects.mockClear();
});

const defaultState = {
  repositories: {
    repositories: [
      {
        id: 'r1',
        name: 'Repository 1',
        slug: 'repository-1',
        old_slugs: [],
        description: 'This is a test repository.',
        repo_url: 'https://github.com/test/test-repo',
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
          old_slugs: ['old-slug'],
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
        old_slugs: [],
        project: 'project1',
        description: 'Task Description',
        status: 'Completed',
      },
      {
        id: 'task2',
        name: 'Task 2',
        slug: 'task-2',
        old_slugs: [],
        project: 'project1',
        description: 'Task Description',
        status: 'In progress',
      },
      {
        id: 'task3',
        name: 'Task 3',
        slug: 'task-3',
        old_slugs: [],
        project: 'project1',
        description: 'Task Description',
        status: 'Planned',
      },
      {
        id: 'task4',
        name: 'Task 4',
        slug: 'task-4',
        old_slugs: [],
        project: 'project1',
        description: 'Task Description',
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
  });

  describe('with websocket', () => {
    beforeEach(() => {
      window.socket = { subscribe: jest.fn(), unsubscribe: jest.fn() };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'socket');
    });

    test('subscribes to task', () => {
      setup();

      expect(window.socket.subscribe).toHaveBeenCalledTimes(4);
      expect(window.socket.subscribe).toHaveBeenCalledWith({
        model: 'task',
        id: 'task1',
      });
    });

    test('unsubscribes from task on unmount', () => {
      const { unmount } = setup();

      expect(window.socket.unsubscribe).not.toHaveBeenCalled();

      unmount();

      expect(window.socket.subscribe).toHaveBeenCalledTimes(4);
      expect(window.socket.unsubscribe).toHaveBeenCalledWith({
        model: 'task',
        id: 'task1',
      });
    });
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
});
