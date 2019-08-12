import React from 'react';
import { StaticRouter } from 'react-router-dom';

import TaskDetail from '@/components/tasks/detail';
import { fetchObjects } from '@/store/actions';
import routes from '@/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');

fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObjects.mockClear();
});

const defaultState = {
  products: {
    products: [
      {
        id: 'p1',
        name: 'Product 1',
        slug: 'product-1',
        old_slugs: [],
        description: 'This is a test product.',
        repo_url: 'https://www.github.com/test/test-repo',
      },
    ],
    notFound: ['different-product'],
    next: null,
  },
  projects: {
    p1: {
      projects: [
        {
          id: 'project1',
          slug: 'project-1',
          name: 'Project 1',
          product: 'p1',
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
};

describe('<TaskDetail/>', () => {
  const setup = options => {
    const defaults = {
      initialState: defaultState,
      productSlug: 'product-1',
      projectSlug: 'project-1',
      taskSlug: 'task-1',
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, productSlug, projectSlug, taskSlug } = opts;
    const context = {};
    const { getByText, getByTitle, queryByText } = renderWithRedux(
      <StaticRouter context={context}>
        <TaskDetail
          match={{ params: { productSlug, projectSlug, taskSlug } }}
        />
      </StaticRouter>,
      initialState,
      storeWithThunk,
    );
    return { getByText, getByTitle, queryByText, context };
  };

  test('renders task detail', () => {
    const { getByText, getByTitle, queryByText } = setup();

    expect(getByTitle('Task 1')).toBeVisible();
    expect(getByText('Task Description')).toBeVisible();
    expect(queryByText('View Branch')).toBeNull();
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

  describe('product does not exist', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText, queryByText } = setup({
        productSlug: 'different-product',
      });

      expect(queryByText('Task 1')).toBeNull();
      expect(getByText('list of all products')).toBeVisible();
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
        routes.task_detail('product-1', 'project-1', 'task-1'),
      );
    });
  });
});
