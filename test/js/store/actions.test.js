import fetchMock from 'fetch-mock';

import * as actions from '@/store/actions';
import { addUrlParams } from '@/utils/api';

import { storeWithThunk } from './../utils';

describe('fetchObjects with `reset: true`', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.repository_list();
    objectPayload = {
      objectType: 'repository',
      url,
      reset: true,
      filters: {},
    };
  });

  describe('success', () => {
    test('GETs repositories from api', () => {
      const store = storeWithThunk({});
      const repository = {
        id: 'r1',
        name: 'Repository 1',
        slug: 'repository-1',
        description: 'This is a test repository.',
        repo_url: 'http://www.test.test',
      };
      const response = { next: null, results: [repository] };
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
        .dispatch(
          actions.fetchObjects({ objectType: 'repository', reset: true }),
        )
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });

    describe('with shouldSubscribeToObject', () => {
      let store, repo;

      beforeEach(() => {
        window.socket = { subscribe: jest.fn() };
        store = storeWithThunk({});
        repo = {
          id: 'r1',
          name: 'Repository 1',
          slug: 'repository-1',
          description: 'This is a test repository.',
          repo_url: 'http://www.test.test',
          shouldSubscribe: true,
        };
      });

      afterEach(() => {
        Reflect.deleteProperty(window, 'socket');
      });

      test('subscribes to socket if test passes', () => {
        const response = [repo, { ...repo, shouldSubscribe: false }];
        fetchMock.getOnce(url, response);

        expect.assertions(2);
        return store
          .dispatch(
            actions.fetchObjects({
              objectType: 'repository',
              reset: true,
              shouldSubscribeToObject: obj => obj.shouldSubscribe,
            }),
          )
          .then(() => {
            expect(window.socket.subscribe).toHaveBeenCalledTimes(1);
            expect(window.socket.subscribe).toHaveBeenCalledWith({
              model: 'repository',
              id: 'r1',
            });
          });
      });

      test('does not subscribe if test fails', () => {
        const response = { next: null, results: [repo] };
        fetchMock.getOnce(url, response);

        expect.assertions(1);
        return store
          .dispatch(
            actions.fetchObjects({ objectType: 'repository', reset: true }),
          )
          .then(() => {
            expect(window.socket.subscribe).not.toHaveBeenCalled();
          });
      });
    });
  });

  test('throws error if no url', () => {
    const store = storeWithThunk({});
    const payload = { ...objectPayload, objectType: 'foo', url: undefined };
    const started = {
      type: 'FETCH_OBJECTS_STARTED',
      payload,
    };
    const failed = {
      type: 'FETCH_OBJECTS_FAILED',
      payload,
    };

    expect.assertions(1);
    return store
      .dispatch(actions.fetchObjects({ objectType: 'foo', reset: true }))
      .catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
      });
  });

  describe('error', () => {
    test('dispatches FETCH_OBJECTS_FAILED action', () => {
      const store = storeWithThunk({});
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
        .dispatch(
          actions.fetchObjects({ objectType: 'repository', reset: true }),
        )
        .catch(() => {
          const allActions = store.getActions();

          expect(allActions[0]).toEqual(started);
          expect(allActions[1].type).toEqual('ERROR_ADDED');
          expect(allActions[1].payload.message).toEqual(
            'Internal Server Error: {}',
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
    const baseUrl = window.api_urls.repository_list();
    const filters = { page: 2 };
    url = addUrlParams(baseUrl, filters);
    objectPayload = {
      objectType: 'repository',
      url,
      reset: false,
      filters: {},
    };
  });

  describe('success', () => {
    test('GETs next repositories page', () => {
      const store = storeWithThunk({});
      const nextRepositories = [
        { id: 'p2', name: 'Repository 2', slug: 'repository-2' },
      ];
      const mockResponse = {
        next: null,
        results: nextRepositories,
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
        .dispatch(actions.fetchObjects({ url, objectType: 'repository' }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_OBJECTS_FAILED action', () => {
      const store = storeWithThunk({});
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
        .dispatch(actions.fetchObjects({ url, objectType: 'repository' }))
        .catch(() => {
          const allActions = store.getActions();

          expect(allActions[0]).toEqual(started);
          expect(allActions[1].type).toEqual('ERROR_ADDED');
          expect(allActions[1].payload.message).toEqual(
            'Internal Server Error: Oops.',
          );
          expect(allActions[2]).toEqual(failed);
          expect(window.console.error).toHaveBeenCalled();
        });
    });
  });
});

describe('fetchObject', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.repository_list();
    objectPayload = {
      objectType: 'repository',
      url,
    };
  });

  describe('success', () => {
    test('GETs repository from api', () => {
      const store = storeWithThunk({});
      const filters = { slug: 'repository-1' };
      const repository = {
        id: 'r1',
        name: 'Repository 1',
        slug: 'repository-1',
      };
      fetchMock.getOnce(addUrlParams(url, filters), { results: [repository] });
      const started = {
        type: 'FETCH_OBJECT_STARTED',
        payload: { filters, ...objectPayload },
      };
      const succeeded = {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: { filters, object: repository, ...objectPayload },
      };

      expect.assertions(1);
      return store
        .dispatch(actions.fetchObject({ objectType: 'repository', filters }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });

    test('stores null if no repository returned from api', () => {
      const store = storeWithThunk({});
      const filters = { slug: 'repository-1' };
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
        .dispatch(actions.fetchObject({ objectType: 'repository', filters }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });
  });

  test('throws error if no url', () => {
    const store = storeWithThunk({});
    const payload = {
      ...objectPayload,
      objectType: 'foo',
      url: undefined,
      filters: {},
    };
    const started = {
      type: 'FETCH_OBJECT_STARTED',
      payload,
    };
    const failed = {
      type: 'FETCH_OBJECT_FAILED',
      payload,
    };

    expect.assertions(1);
    return store
      .dispatch(actions.fetchObject({ objectType: 'foo' }))
      .catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
      });
  });

  describe('error', () => {
    test('dispatches FETCH_OBJECT_FAILED action', () => {
      const store = storeWithThunk({});
      fetchMock.getOnce(url, {
        status: 500,
        body: { detail: 'Nope.' },
      });
      const started = {
        type: 'FETCH_OBJECT_STARTED',
        payload: { filters: {}, ...objectPayload },
      };
      const failed = {
        type: 'FETCH_OBJECT_FAILED',
        payload: { filters: {}, ...objectPayload },
      };

      expect.assertions(5);
      return store
        .dispatch(actions.fetchObject({ objectType: 'repository' }))
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

describe('createObject', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.project_list();
    objectPayload = {
      objectType: 'project',
      data: {
        name: 'Object Name',
      },
      url,
    };
  });

  describe('success', () => {
    test('POSTs object to api', () => {
      const store = storeWithThunk({});
      const object = { id: 'o1', name: 'Object Name', slug: 'object-1' };
      fetchMock.postOnce(url, object);
      const started = {
        type: 'CREATE_OBJECT_STARTED',
        payload: objectPayload,
      };
      const succeeded = {
        type: 'CREATE_OBJECT_SUCCEEDED',
        payload: { object, ...objectPayload },
      };

      expect.assertions(1);
      return store.dispatch(actions.createObject(objectPayload)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });

    describe('with shouldSubscribeToObject', () => {
      let store, project;

      beforeEach(() => {
        window.socket = { subscribe: jest.fn() };
        store = storeWithThunk({});
        project = {
          id: 'project-id',
          shouldSubscribe: true,
        };
      });

      afterEach(() => {
        Reflect.deleteProperty(window, 'socket');
      });

      test('subscribes to socket if test passes', () => {
        fetchMock.postOnce(url, project);

        expect.assertions(2);
        return store
          .dispatch(
            actions.createObject({
              objectType: 'project',
              shouldSubscribeToObject: o => o.shouldSubscribe,
            }),
          )
          .then(() => {
            expect(window.socket.subscribe).toHaveBeenCalledTimes(1);
            expect(window.socket.subscribe).toHaveBeenCalledWith({
              model: 'project',
              id: 'project-id',
            });
          });
      });

      test('does not subscribe if test fails', () => {
        fetchMock.postOnce(url, project);

        expect.assertions(1);
        return store
          .dispatch(actions.createObject({ objectType: 'project' }))
          .then(() => {
            expect(window.socket.subscribe).not.toHaveBeenCalled();
          });
      });
    });
  });

  test('throws error if no url', () => {
    const store = storeWithThunk({});
    const payload = {
      ...objectPayload,
      objectType: 'foo',
      url: undefined,
      data: {},
    };
    const started = {
      type: 'CREATE_OBJECT_STARTED',
      payload,
    };
    const failed = {
      type: 'CREATE_OBJECT_FAILED',
      payload,
    };

    expect.assertions(1);
    return store
      .dispatch(actions.createObject({ objectType: 'foo' }))
      .catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
      });
  });

  describe('error', () => {
    test('dispatches CREATE_OBJECT_FAILED action', () => {
      const store = storeWithThunk({});
      fetchMock.postOnce(url, 500);
      const started = {
        type: 'CREATE_OBJECT_STARTED',
        payload: objectPayload,
      };
      const failed = {
        type: 'CREATE_OBJECT_FAILED',
        payload: objectPayload,
      };

      expect.assertions(5);
      return store.dispatch(actions.createObject(objectPayload)).catch(() => {
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
