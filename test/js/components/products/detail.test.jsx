import React from 'react';
import { StaticRouter } from 'react-router-dom';

import ProductDetail from '@/components/products/detail';
import { fetchObject } from '@/store/actions';
import routes from '@/utils/routes';

jest.mock('@/store/actions');

fetchObject.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  fetchObject.mockClear();
});

import { renderWithRedux, storeWithApi } from './../../utils';

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
};

describe('<ProductList />', () => {
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
      storeWithApi,
    );
    return { getByText, getByTitle, queryByText, context };
  };

  test('renders product detail', () => {
    const { getByText, getByTitle } = setup();

    expect(getByTitle('Product 1')).toBeVisible();
    expect(getByText('This is a test product.')).toBeVisible();
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
});
