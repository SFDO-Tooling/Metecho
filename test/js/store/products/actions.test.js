import fetchMock from 'fetch-mock';

import * as actions from '@/store/products/actions';
import { addUrlParams } from '@/utils/api';

import { storeWithApi } from './../../utils';

describe('fetchProducts', () => {
  describe('success', () => {
    test('GETs products from api', () => {
      const store = storeWithApi({});
      const product = {
        id: 'p1',
        name: 'Product 1',
        slug: 'product-1',
        description: 'This is a test product.',
        repo_url: 'http://www.test.test',
      };
      const response = { next: null, results: [product] };
      fetchMock.getOnce(window.api_urls.product_list(), response);
      const started = {
        type: 'FETCH_PRODUCTS_STARTED',
      };
      const succeeded = {
        type: 'FETCH_PRODUCTS_SUCCEEDED',
        payload: response,
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchProducts()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_PRODUCTS_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.product_list(), {
        status: 500,
        body: {},
      });
      const started = {
        type: 'FETCH_PRODUCTS_STARTED',
      };
      const failed = {
        type: 'FETCH_PRODUCTS_FAILED',
      };

      expect.assertions(5);
      return store.dispatch(actions.fetchProducts()).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('fetchMoreProducts', () => {
  let url;

  beforeAll(() => {
    const baseUrl = window.api_urls.product_list();
    const filters = { page: 2 };
    url = addUrlParams(baseUrl, filters);
  });

  describe('success', () => {
    test('GETs next products page', () => {
      const store = storeWithApi({});
      const nextProducts = [{ id: 'p2', name: 'Product 2', slug: 'product-2' }];
      const mockResponse = {
        next: null,
        results: nextProducts,
      };
      fetchMock.getOnce(url, mockResponse);
      const started = {
        type: 'FETCH_MORE_PRODUCTS_STARTED',
        payload: { url },
      };
      const succeeded = {
        type: 'FETCH_MORE_PRODUCTS_SUCCEEDED',
        payload: mockResponse,
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchMoreProducts({ url })).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_MORE_PRODUCTS_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(url, { status: 500, body: 'Oops.' });
      const started = {
        type: 'FETCH_MORE_PRODUCTS_STARTED',
        payload: { url },
      };
      const failed = {
        type: 'FETCH_MORE_PRODUCTS_FAILED',
        payload: { url },
      };

      expect.assertions(5);
      return store.dispatch(actions.fetchMoreProducts({ url })).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Oops.');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('fetchProduct', () => {
  let baseUrl;

  beforeAll(() => {
    baseUrl = window.api_urls.product_list();
  });

  describe('success', () => {
    test('GETs product from api', () => {
      const store = storeWithApi({});
      const filters = { slug: 'product-1' };
      const product = { id: 'p1', name: 'Product 1', slug: 'product-1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), { results: [product] });
      const started = {
        type: 'FETCH_PRODUCT_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_PRODUCT_SUCCEEDED',
        payload: { ...filters, product },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchProduct(filters)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });

    test('stores null if no product returned from api', () => {
      const store = storeWithApi({});
      const filters = { slug: 'product-1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), 404);
      const started = {
        type: 'FETCH_PRODUCT_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_PRODUCT_SUCCEEDED',
        payload: { ...filters, product: null },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchProduct(filters)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_PRODUCT_FAILED action', () => {
      const store = storeWithApi({});
      const filters = { slug: 'product-1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), {
        status: 500,
        body: { detail: 'Nope.' },
      });
      const started = {
        type: 'FETCH_PRODUCT_STARTED',
        payload: filters,
      };
      const failed = {
        type: 'FETCH_PRODUCT_FAILED',
        payload: filters,
      };

      expect.assertions(5);
      return store.dispatch(actions.fetchProduct(filters)).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Nope.');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('syncRepos', () => {
  test('dispatches SyncRepos action and fetches products', () => {
    const store = storeWithApi({});
    fetchMock.getOnce(window.api_urls.product_list(), {
      next: null,
      results: [],
    });
    fetchMock.postOnce(window.api_urls.user_refresh(), {
      status: 204,
      body: {},
    });
    const syncReposStarted = {
      type: 'SYNC_REPOS_STARTED',
    };
    const syncReposSucceeded = {
      type: 'SYNC_REPOS_SUCCEEDED',
    };
    const started = {
      type: 'FETCH_PRODUCTS_STARTED',
    };
    const succeeded = {
      type: 'FETCH_PRODUCTS_SUCCEEDED',
      payload: { next: null, results: [] },
    };

    expect.assertions(1);
    return store.dispatch(actions.syncRepos()).then(() => {
      expect(store.getActions()).toEqual([
        syncReposStarted,
        syncReposSucceeded,
        started,
        succeeded,
      ]);
    });
  });

  describe('error', () => {
    test('dispatches FETCH_PRODUCT_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.postOnce(window.api_urls.user_refresh(), {
        status: 500,
        body: { non_field_errors: ['Foobar'] },
      });
      const started = {
        type: 'SYNC_REPOS_STARTED',
      };
      const failed = {
        type: 'SYNC_REPOS_FAILED',
      };

      expect.assertions(5);
      return store.dispatch(actions.syncRepos()).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Foobar');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
