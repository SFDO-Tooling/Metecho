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

  describe('FETCH_OBJECTS_SUCCEEDED', () => {
    test('resets products list if `reset: true`', () => {
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
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [product2], next: 'next-url' },
            objectType: 'product',
            reset: true,
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('adds to products list if `reset: false`', () => {
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
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: { results: [fetchedProduct], next: null },
          objectType: 'product',
          reset: false,
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "product"', () => {
      const product = {
        id: 'p1',
        slug: 'product-1',
        name: 'Product 1',
      };
      const expected = { products: [product], next: 'next-url' };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: { results: [], next: null },
          objectType: 'other-object',
          reset: true,
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('FETCH_OBJECT_SUCCEEDED', () => {
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
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: product2,
            filters: { slug: 'product-2' },
            objectType: 'product',
          },
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
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: null,
            filters: { slug: 'product-3' },
            objectType: 'product',
          },
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
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: product1,
          filters: { slug: 'product-1' },
          objectType: 'product',
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "product"', () => {
      const product = {
        id: 'p1',
        slug: 'product-1',
        name: 'Product 1',
      };
      const product2 = {
        id: 'p2',
        slug: 'product-2',
        name: 'Product 2',
      };
      const expected = { products: [product], next: null };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: product2,
          filters: { slug: 'product-2' },
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(expected);
    });
  });
});
