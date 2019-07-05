import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import ProductDetail from '@/components/products/detail';

import { renderWithRedux, storeWithApi } from './../../utils';

const defaultState = {
  products: {
    products: [
      {
        id: 'p1',
        name: 'Product 1',
        slug: 'product-1',
        description: 'This is a test product.',
        repo_url: 'https://www.github.com/test/test-repo',
        old_slugs: [],
      },
    ],
    notFound: [],
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
    const { debug, getByTitle, getByText } = renderWithRedux(
      <MemoryRouter>
        <ProductDetail match={{ params: { productSlug } }} />
      </MemoryRouter>,
      initialState,
      storeWithApi,
    );
    return { debug, getByTitle, getByText };
  };

  test('renders product detail', () => {
    const { getByText } = setup();

    expect(getByText('[Product 1]')).toBeVisible();
    expect(getByText('This is a test product.')).toBeVisible();
  });

  test('product not found', () => {
    const state = {
      products: defaultState,
      productSlug: 'Product 2',
    };
    const { debug } = setup(state);
    debug();
  });
});
