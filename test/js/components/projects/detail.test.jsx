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
  products: {
    products: [
      {
        id: 'p1',
        name: 'Product 1',
        slug: 'product-1',
        old_slugs: ['old-slug'],
        description: 'This is a test product.',
        repo_url: 'https://www.github.com/test/test-repo',
      },
    ],
    notFound: ['yet-another-product'],
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
          old_slugs: ['old-slug'],
        },
      ],
      next: null,
      notFound: [],
      fetched: true,
    },
  },
  tasks: {
    project1: [],
  },
};
describe('<ProjectDetail/>', () => {
  const setup = options => {
    const defaults = {
      initialState: defaultState,
      productSlug: 'product-1',
      projectSlug: 'project-1',
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, productSlug, projectSlug } = opts;
    const context = {};
    const { debug, getByText, getByTitle, queryByText } = renderWithRedux(
      <StaticRouter context={context}>
        <ProjectDetail match={{ params: { productSlug, projectSlug } }} />
      </StaticRouter>,
      initialState,
      storeWithThunk,
    );
    return { debug, getByText, getByTitle, queryByText, context };
  };

  test('renders project detail', () => {
    const { getByText, getByTitle } = setup();
    expect(getByTitle('Project 1')).toBeVisible();
    expect(getByText('Project Description')).toBeVisible();
  });

  test('fetches tasks list', () => {
    setup();
    expect(fetchObjects).toHaveBeenCalledWith({
      filters: { project: 'project1' },
      objectType: 'task',
    });
  });

  test('renders tasks table', () => {
    const { getByText } = setup({
      initialState: {
        ...defaultState,
        tasks: {
          project1: [
            {
              id: 'task 1',
              name: 'task 1',
            },
          ],
        },
      },
    });
    expect(getByText('task 1')).toBeVisible();
  });

  test('displays spinner while fetching data', () => {
    const { getByText } = setup({
      initialState: {
        products: {
          products: [
            {
              id: 'p1',
              name: 'Product 1',
              slug: 'product-1',
              old_slugs: ['old-slug'],
              description: 'This is a test product.',
              repo_url: 'https://www.github.com/test/test-repo',
            },
          ],
          notFound: ['yet-another-product'],
          next: null,
        },
        projects: {},
        tasks: {},
      },
    });
    expect(getByText('Loading...')).toBeVisible();
  });

  describe('project does not exist', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText, queryByText } = setup({
        projectSlug: null,
        initialState: {
          products: {
            products: [
              {
                id: 'p1',
                name: 'Product 1',
                slug: 'product-1',
                old_slugs: ['old-slug'],
                description: 'This is a test product.',
                repo_url: 'https://www.github.com/test/test-repo',
              },
            ],
            notFound: ['yet-another-product'],
            next: null,
          },
          projects: {
            p1: null,
          },
          tasks: {},
        },
      });
      expect(queryByText('Product 1')).toBeNull();
      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('old project slug', () => {
    test('redirects to project_detail with new slug', () => {
      const { context } = setup({
        productSlug: 'product-1',
        projectSlug: 'old-slug',
      });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(
        routes.project_detail('product-1', 'old-slug'),
      );
    });
  });
});
