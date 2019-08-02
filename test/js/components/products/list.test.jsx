import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import ProductList from '@/components/products/list';
import { fetchObjects } from '@/store/actions';
import { syncRepos } from '@/store/products/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('react-fns', () => ({
  withScroll(Component) {
    // eslint-disable-next-line react/display-name
    return props => <Component x={0} y={0} {...props} />;
  },
}));
jest.mock('@/store/actions');
jest.mock('@/store/products/actions');
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
syncRepos.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObjects.mockClear();
  syncRepos.mockClear();
});

describe('<ProductList />', () => {
  const setup = (
    initialState = {
      products: { products: [], notFound: [], next: null },
    },
    props = {},
    rerenderFn = null,
  ) => {
    const { getByText, queryByText, rerender } = renderWithRedux(
      <MemoryRouter>
        <ProductList {...props} />
      </MemoryRouter>,
      initialState,
      storeWithThunk,
      rerenderFn,
    );
    return { getByText, queryByText, rerender };
  };

  test('renders products list (empty)', () => {
    const { getByText } = setup();

    expect(getByText('¯\\_(ツ)_/¯')).toBeVisible();
  });

  test('renders products list', () => {
    const initialState = {
      products: {
        products: [
          {
            id: 'p1',
            name: 'Product 1',
            slug: 'product-1',
            description: 'This is a test product.',
            repo_url: 'https://www.github.com/test/test-repo',
          },
        ],
        notFound: [],
        next: null,
      },
    };
    const { getByText } = setup(initialState);

    expect(getByText('Product 1')).toBeVisible();
    expect(getByText('This is a test product.')).toBeVisible();
  });

  describe('fetching more products', () => {
    const initialState = {
      products: {
        products: [
          {
            id: 'p1',
            name: 'Product 1',
            slug: 'product-1',
            description: 'This is a test product.',
            repo_url: 'https://www.github.com/test/test-repo',
          },
        ],
        notFound: [],
        next: 'next-url',
      },
    };

    beforeAll(() => {
      jest
        .spyOn(document.documentElement, 'scrollHeight', 'get')
        .mockImplementation(() => 1100);
    });

    afterEach(() => {
      window.sessionStorage.removeItem('activeProductsTab');
    });

    test('fetches next page of products', () => {
      const { rerender, getByText } = setup(initialState);
      setup(initialState, { y: 1000 }, rerender);

      expect(getByText('Loading…')).toBeVisible();
      expect(fetchObjects).toHaveBeenCalledWith({
        url: 'next-url',
        objectType: 'product',
      });
    });

    test('does not fetch next page if no more products', () => {
      const state = {
        ...initialState,
        products: {
          ...initialState.products,
          next: null,
        },
      };
      const { rerender, queryByText } = setup(state);

      setup(state, { y: 1000 }, rerender);

      expect(queryByText('Loading…')).toBeNull();
      expect(fetchObjects).not.toHaveBeenCalled();
    });
  });

  describe('sync repos clicked', () => {
    test('sync repos', () => {
      const { getByText } = setup();
      const btn = getByText('Sync GitHub Repositories');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(getByText('Syncing GitHub Repos…')).toBeVisible();
      expect(syncRepos).toHaveBeenCalledTimes(1);
    });
  });
});
