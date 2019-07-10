import fetchMock from 'fetch-mock';

import * as actions from '@/store/actions';
import { addUrlParams } from '@/utils/api';

import { storeWithApi } from './../utils';

describe('fetchObjects with `reset: true`', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.product_list();
    objectPayload = {
      objectType: 'product',
      url,
      reset: true,
    };
  });

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
      fetchMock.getOnce(url, response);
      const started = {
        type: 'FETCH_OBJECTS_STARTED',
        payload: objectPayload,
      };
      const succeeded = {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: { response, ...objectPayload },
      };

      expect.assertions(1);
      return store
        .dispatch(actions.fetchObjects({ objectType: 'product', reset: true }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_OBJECTS_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(url, {
        status: 500,
        body: {},
      });
      const started = {
        type: 'FETCH_OBJECTS_STARTED',
        payload: objectPayload,
      };
      const failed = {
        type: 'FETCH_OBJECTS_FAILED',
        payload: objectPayload,
      };

      expect.assertions(5);
      return store
        .dispatch(actions.fetchObjects({ objectType: 'product', reset: true }))
        .catch(() => {
          const allActions = store.getActions();

          expect(allActions[0]).toEqual(started);
          expect(allActions[1].type).toEqual('ERROR_ADDED');
          expect(allActions[1].payload.message).toEqual(
            'Internal Server Error',
          );
          expect(allActions[2]).toEqual(failed);
          expect(window.console.error).toHaveBeenCalled();
        });
    });
  });
});

describe('fetchObjects with `reset: false`', () => {
  let url, objectPayload;

  beforeAll(() => {
    const baseUrl = window.api_urls.product_list();
    const filters = { page: 2 };
    url = addUrlParams(baseUrl, filters);
    objectPayload = {
      objectType: 'product',
      url,
      reset: false,
    };
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
        type: 'FETCH_OBJECTS_STARTED',
        payload: objectPayload,
      };
      const succeeded = {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: { response: mockResponse, ...objectPayload },
      };

      expect.assertions(1);
      return store
        .dispatch(actions.fetchObjects({ url, objectType: 'product' }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_OBJECTS_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(url, { status: 500, body: 'Oops.' });
      const started = {
        type: 'FETCH_OBJECTS_STARTED',
        payload: objectPayload,
      };
      const failed = {
        type: 'FETCH_OBJECTS_FAILED',
        payload: objectPayload,
      };

      expect.assertions(5);
      return store
        .dispatch(actions.fetchObjects({ url, objectType: 'product' }))
        .catch(() => {
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

describe('fetchObject', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.product_list();
    objectPayload = {
      objectType: 'product',
      url,
    };
  });

  describe('success', () => {
    test('GETs product from api', () => {
      const store = storeWithApi({});
      const filters = { slug: 'product-1' };
      const product = { id: 'p1', name: 'Product 1', slug: 'product-1' };
      fetchMock.getOnce(addUrlParams(url, filters), { results: [product] });
      const started = {
        type: 'FETCH_OBJECT_STARTED',
        payload: { filters, ...objectPayload },
      };
      const succeeded = {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: { filters, object: product, ...objectPayload },
      };

      expect.assertions(1);
      return store
        .dispatch(actions.fetchObject({ objectType: 'product', filters }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });

    test('stores null if no product returned from api', () => {
      const store = storeWithApi({});
      const filters = { slug: 'product-1' };
      fetchMock.getOnce(addUrlParams(url, filters), 404);
      const started = {
        type: 'FETCH_OBJECT_STARTED',
        payload: { filters, ...objectPayload },
      };
      const succeeded = {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: { filters, object: null, ...objectPayload },
      };

      expect.assertions(1);
      return store
        .dispatch(actions.fetchObject({ objectType: 'product', filters }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_OBJECT_FAILED action', () => {
      const store = storeWithApi({});
      const filters = { slug: 'product-1' };
      fetchMock.getOnce(addUrlParams(url, filters), {
        status: 500,
        body: { detail: 'Nope.' },
      });
      const started = {
        type: 'FETCH_OBJECT_STARTED',
        payload: { filters, ...objectPayload },
      };
      const failed = {
        type: 'FETCH_OBJECT_FAILED',
        payload: { filters, ...objectPayload },
      };

      expect.assertions(5);
      return store
        .dispatch(actions.fetchObject({ objectType: 'product', filters }))
        .catch(() => {
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
