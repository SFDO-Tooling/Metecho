import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import ProductDetail from '@/components/products/detail';
import { fetchObject, fetchObjects } from '@/store/actions';
import routes from '@/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');

fetchObject.mockReturnValue({ type: 'TEST' });
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
        },
      ],
      next: 'next-url',
      notFound: [],
      fetched: true,
    },
  },
};

describe('<ProductDetail />', () => {
  const setup = options => {
    const defaults = {
      initialState: defaultState,
      productSlug: 'product-1',
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, productSlug } = opts;
    const context = {};
    const { getByText, getByTitle, queryByText } = renderWithRedux(
      <StaticRouter context={context}>
        <ProductDetail match={{ params: { productSlug } }} />
      </StaticRouter>,
      initialState,
      storeWithThunk,
    );
    return { getByText, getByTitle, queryByText, context };
  };

  test('renders product detail and projects list', () => {
    const { getByText, getByTitle } = setup();

    expect(getByTitle('Product 1')).toBeVisible();
    expect(getByText('This is a test product.')).toBeVisible();
    expect(getByText('Project 1')).toBeVisible();
    expect(getByText('Projects for Product 1')).toBeVisible();
  });

  test('renders with form expanded if no projects', () => {
    const { getByText, queryByText } = setup({
      initialState: {
        ...defaultState,
        projects: {
          p1: {
            projects: [],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
      },
    });

    expect(getByText('Create a Project for Product 1')).toBeVisible();
    expect(queryByText('Projects for Product 1')).toBeNull();
  });

  describe('product not found', () => {
    test('fetches product from API', () => {
      const { queryByText } = setup({ productSlug: 'other-product' });

      expect(queryByText('Product 1')).toBeNull();
      expect(fetchObject).toHaveBeenCalledWith({
        filters: { slug: 'other-product' },
        objectType: 'product',
      });
    });
  });

  describe('product does not exist', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText, queryByText } = setup({
        productSlug: 'yet-another-product',
      });

      expect(queryByText('Product 1')).toBeNull();
      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('old product slug', () => {
    test('redirects to product_detail with new slug', () => {
      const { context } = setup({ productSlug: 'old-slug' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(routes.product_detail('product-1'));
    });
  });

  describe('no product slug', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText, queryByText } = setup({ productSlug: '' });

      expect(queryByText('Product 1')).toBeNull();
      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('projects have not been fetched', () => {
    test('fetches projects from API', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            p1: {
              projects: [],
              next: null,
              notFound: [],
              fetched: false,
            },
          },
        },
      });

      expect(queryByText('Projects for Product 1')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { product: 'p1' },
        objectType: 'project',
        reset: true,
      });
    });
  });

  describe('fetching more projects', () => {
    test('fetches next page of projects', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            p1: {
              projects: [
                {
                  branch_url: 'branch-url',
                  description: 'product description',
                  id: 'project1',
                  name: 'Project 1',
                  old_slugs: [],
                  product: 'p1',
                  slug: 'project-1',
                },
              ],
              next: 'next-url',
              notFound: [],
              fetched: true,
            },
          },
        },
      });
      const btn = getByText('Load More');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { product: 'p1' },
        objectType: 'project',
        url: 'next-url',
      });

      expect(getByText('Loading…')).toBeVisible();
    });

    test('hides btn when at end of list', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            p1: {
              projects: [
                {
                  branch_url: 'branch-url',
                  description: 'product description',
                  id: 'project1',
                  name: 'Project 1',
                  old_slugs: [],
                  product: 'p1',
                  slug: 'project-1',
                },
              ],
              next: null,
              notFound: [],
              fetched: true,
            },
          },
        },
      });

      expect(queryByText('Load More')).toBeNull();
    });
  });
});
