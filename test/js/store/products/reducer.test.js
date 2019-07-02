import reducer from '@/store/products/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = { products: [], next: null, notFound: [] };
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const product1 = {
      id: 'p1',
      slug: 'product-1',
      name: 'Product 1',
      description: 'This is a test product.',
    };
    const expected = { products: [], next: null, notFound: [] };
    const actual = reducer(
      { products: [product1], next: 'next-url', notFound: ['product-1'] },
      { type: 'USER_LOGGED_OUT' },
    );

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_PRODUCTS_SUCCEEDED action', () => {
    const product1 = {
      id: 'p1',
      slug: 'product-1',
      name: 'Product 1',
      description: 'This is a test product.',
    };
    const product2 = {
      id: 'p2',
      slug: 'product-2',
      name: 'Product 2',
      description: 'This is another test product.',
    };
    const expected = { products: [product2], next: 'next-url' };
    const actual = reducer(
      { products: [product1], next: null },
      {
        type: 'FETCH_PRODUCTS_SUCCEEDED',
        payload: { results: [product2], next: 'next-url' },
      },
    );

    expect(actual).toEqual(expected);
  });

  describe('FETCH_MORE_PRODUCTS_SUCCEEDED action', () => {
    const mockProducts = {
      notFound: [],
      products: [
        {
          id: 'product1',
          slug: 'product-1',
          name: 'Product 1',
        },
      ],
      next: null,
    };
    const fetchedProduct = {
      id: 'product2',
      slug: 'product-2',
      name: 'Product 2',
    };
    const expected = {
      ...mockProducts,
      products: [...mockProducts.products, fetchedProduct],
    };
    const actual = reducer(mockProducts, {
      type: 'FETCH_MORE_PRODUCTS_SUCCEEDED',
      payload: { results: [fetchedProduct], next: null },
    });

    expect(actual).toEqual(expected);
  });

  describe('FETCH_PRODUCT_SUCCEEDED', () => {
    test('adds product', () => {
      const product1 = {
        id: 'p1',
        slug: 'product-1',
        name: 'Product 1',
      };
      const product2 = {
        id: 'p2',
        slug: 'product-2',
        name: 'Product 2',
      };
      const expected = { products: [product1, product2] };
      const actual = reducer(
        { products: [product1] },
        {
          type: 'FETCH_PRODUCT_SUCCEEDED',
          payload: { product: product2 },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores id of missing product', () => {
      const product1 = {
        id: 'p1',
        slug: 'product-1',
        name: 'Product 1',
      };
      const expected = {
        products: [product1],
        notFound: ['product-2', 'product-3'],
      };
      const actual = reducer(
        { products: [product1], notFound: ['product-2'] },
        {
          type: 'FETCH_PRODUCT_SUCCEEDED',
          payload: { product: null, slug: 'product-3' },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores duplicate product', () => {
      const product1 = {
        id: 'p1',
        slug: 'product-1',
        name: 'Product 1',
      };
      const expected = {
        products: [product1],
        notFound: ['product-2'],
      };
      const actual = reducer(expected, {
        type: 'FETCH_PRODUCT_SUCCEEDED',
        payload: { product: product1, slug: 'product-1' },
      });

      expect(actual).toEqual(expected);
    });
  });
});
