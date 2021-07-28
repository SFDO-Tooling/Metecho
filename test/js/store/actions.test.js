import fetchMock from 'fetch-mock';

import * as actions from '@/js/store/actions';
import { addUrlParams } from '@/js/utils/api';

import { storeWithThunk } from './../utils';

describe('fetchObjects with `reset: true`', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.project_list();
    objectPayload = {
      objectType: 'project',
      url,
      reset: true,
      filters: {},
    };
  });

  describe('success', () => {
    test('GETs projects from api', () => {
      const store = storeWithThunk({});
      const project = {
        id: 'r1',
        name: 'Project 1',
        slug: 'project-1',
        description: 'This is a test project.',
        repo_url: 'http://www.test.test',
      };
      const response = { next: null, results: [project] };
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
        .dispatch(actions.fetchObjects({ objectType: 'project', reset: true }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });

    describe('with shouldSubscribeToObject', () => {
      let store, project;

      beforeEach(() => {
        window.socket = { subscribe: jest.fn() };
        store = storeWithThunk({});
        project = {
          id: 'r1',
          name: 'Project 1',
          slug: 'project-1',
          description: 'This is a test project.',
          repo_url: 'http://www.test.test',
          shouldSubscribe: true,
        };
      });

      afterEach(() => {
        Reflect.deleteProperty(window, 'socket');
      });

      test('subscribes to socket if test passes', () => {
        const response = [project, { ...project, shouldSubscribe: false }];
        fetchMock.getOnce(url, response);

        expect.assertions(2);
        return store
          .dispatch(
            actions.fetchObjects({
              objectType: 'project',
              reset: true,
              shouldSubscribeToObject: (obj) => obj.shouldSubscribe,
            }),
          )
          .then(() => {
            expect(window.socket.subscribe).toHaveBeenCalledTimes(1);
            expect(window.socket.subscribe).toHaveBeenCalledWith({
              model: 'project',
              id: 'r1',
            });
          });
      });

      test('does not subscribe if test fails', () => {
        const response = { next: null, results: [project] };
        fetchMock.getOnce(url, response);

        expect.assertions(1);
        return store
          .dispatch(
            actions.fetchObjects({
              objectType: 'project',
              reset: true,
              shouldSubscribeToObject: false,
            }),
          )
          .then(() => {
            expect(window.socket.subscribe).not.toHaveBeenCalled();
          });
      });
    });
  });

  test('throws error if no url', async () => {
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
    try {
      await store.dispatch(
        actions.fetchObjects({ objectType: 'foo', reset: true }),
      );
    } catch (e) {
      // ignore errors
    } finally {
      expect(store.getActions()).toEqual([started, failed]);
    }
  });

  describe('error', () => {
    test('dispatches FETCH_OBJECTS_FAILED action', async () => {
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

      expect.assertions(4);
      try {
        await store.dispatch(
          actions.fetchObjects({ objectType: 'project', reset: true }),
        );
      } catch (e) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual(
          'Internal Server Error: {}',
        );
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('fetchObjects with `reset: false`', () => {
  let url, objectPayload;

  beforeAll(() => {
    const baseUrl = window.api_urls.project_list();
    const filters = { page: 2 };
    url = addUrlParams(baseUrl, filters);
    objectPayload = {
      objectType: 'project',
      url,
      reset: false,
      filters: {},
    };
  });

  describe('success', () => {
    test('GETs next projects page', () => {
      const store = storeWithThunk({});
      const nextProjects = [{ id: 'p2', name: 'Project 2', slug: 'project-2' }];
      const mockResponse = {
        next: null,
        results: nextProjects,
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
        .dispatch(actions.fetchObjects({ url, objectType: 'project' }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_OBJECTS_FAILED action', async () => {
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

      expect.assertions(4);
      try {
        await store.dispatch(
          actions.fetchObjects({ url, objectType: 'project' }),
        );
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual(
          'Internal Server Error: Oops.',
        );
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('fetchObject', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.project_list();
    objectPayload = {
      objectType: 'project',
      url,
    };
  });

  describe('success', () => {
    test('GETs project from api', () => {
      const store = storeWithThunk({});
      const filters = { slug: 'project-1' };
      const project = {
        id: 'r1',
        name: 'Project 1',
        slug: 'project-1',
      };
      fetchMock.getOnce(addUrlParams(url, filters), { results: [project] });
      const started = {
        type: 'FETCH_OBJECT_STARTED',
        payload: { filters, ...objectPayload },
      };
      const succeeded = {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: { filters, object: project, ...objectPayload },
      };

      expect.assertions(1);
      return store
        .dispatch(actions.fetchObject({ objectType: 'project', filters }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });

    test('stores null if no project returned from api', () => {
      const store = storeWithThunk({});
      const filters = { slug: 'project-1' };
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
        .dispatch(actions.fetchObject({ objectType: 'project', filters }))
        .then(() => {
          expect(store.getActions()).toEqual([started, succeeded]);
        });
    });

    describe('with shouldSubscribeToObject', () => {
      let store, filters, project;

      beforeEach(() => {
        window.socket = { subscribe: jest.fn() };
        store = storeWithThunk({});
        filters = { slug: 'project-1' };
        project = {
          id: 'r1',
          name: 'Project 1',
          slug: 'project-1',
        };
      });

      afterEach(() => {
        Reflect.deleteProperty(window, 'socket');
      });

      test('subscribes to socket if test passes', () => {
        fetchMock.getOnce(addUrlParams(url, filters), {
          results: [project],
        });

        expect.assertions(2);
        return store
          .dispatch(
            actions.fetchObject({
              objectType: 'project',
              filters,
              shouldSubscribeToObject: () => true,
            }),
          )
          .then(() => {
            expect(window.socket.subscribe).toHaveBeenCalledTimes(1);
            expect(window.socket.subscribe).toHaveBeenCalledWith({
              model: 'project',
              id: 'r1',
            });
          });
      });

      test('does not subscribe if test fails', () => {
        fetchMock.getOnce(addUrlParams(url, filters), {
          results: [project],
        });

        expect.assertions(1);
        return store
          .dispatch(
            actions.fetchObject({
              objectType: 'project',
              filters,
              shouldSubscribeToObject: () => false,
            }),
          )
          .then(() => {
            expect(window.socket.subscribe).not.toHaveBeenCalled();
          });
      });
    });
  });

  test('throws error if no url', async () => {
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
    try {
      await store.dispatch(actions.fetchObject({ objectType: 'foo' }));
    } catch (errors) {
      // ignore errors
    } finally {
      expect(store.getActions()).toEqual([started, failed]);
    }
  });

  describe('error', () => {
    test('dispatches FETCH_OBJECT_FAILED action', async () => {
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

      expect.assertions(4);
      try {
        await store.dispatch(actions.fetchObject({ objectType: 'project' }));
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Nope.');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('createObject', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.epic_list();
    objectPayload = {
      objectType: 'epic',
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
      let store, epic;

      beforeEach(() => {
        window.socket = { subscribe: jest.fn() };
        store = storeWithThunk({});
        epic = {
          id: 'epic-id',
          shouldSubscribe: true,
        };
      });

      afterEach(() => {
        Reflect.deleteProperty(window, 'socket');
      });

      test('subscribes to socket if test passes', () => {
        fetchMock.postOnce(url, epic);

        expect.assertions(2);
        return store
          .dispatch(
            actions.createObject({
              objectType: 'epic',
              shouldSubscribeToObject: (o) => o.shouldSubscribe,
            }),
          )
          .then(() => {
            expect(window.socket.subscribe).toHaveBeenCalledTimes(1);
            expect(window.socket.subscribe).toHaveBeenCalledWith({
              model: 'epic',
              id: 'epic-id',
            });
          });
      });

      test('does not subscribe if test fails', () => {
        fetchMock.postOnce(url, epic);

        expect.assertions(1);
        return store
          .dispatch(
            actions.createObject({
              objectType: 'epic',
              shouldSubscribeToObject: false,
            }),
          )
          .then(() => {
            expect(window.socket.subscribe).not.toHaveBeenCalled();
          });
      });
    });
  });

  test('throws error if no url', async () => {
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
    try {
      await store.dispatch(actions.createObject({ objectType: 'foo' }));
    } catch (error) {
      // ignore errors
    } finally {
      expect(store.getActions()).toEqual([started, failed]);
    }
  });

  describe('error', () => {
    test('dispatches CREATE_OBJECT_FAILED action', async () => {
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

      expect.assertions(4);
      try {
        await store.dispatch(actions.createObject(objectPayload));
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('deleteObject', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.scratch_org_detail('org-id');
    const org = {
      id: 'org-id',
    };
    objectPayload = {
      objectType: 'scratch_org',
      object: org,
      url,
    };
  });

  describe('success', () => {
    test('sends DELETE to api', () => {
      const store = storeWithThunk({});
      fetchMock.deleteOnce(url, 204);
      const started = {
        type: 'DELETE_OBJECT_STARTED',
        payload: objectPayload,
      };
      const succeeded = {
        type: 'DELETE_OBJECT_SUCCEEDED',
        payload: objectPayload,
      };

      expect.assertions(1);
      return store.dispatch(actions.deleteObject(objectPayload)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });

    describe('with shouldSubscribeToObject', () => {
      let store, org;

      beforeEach(() => {
        window.socket = { subscribe: jest.fn() };
        store = storeWithThunk({});
        org = {
          id: 'org-id',
        };
      });

      afterEach(() => {
        Reflect.deleteProperty(window, 'socket');
      });

      test('subscribes to socket if test passes', () => {
        fetchMock.deleteOnce(url, 204);

        expect.assertions(2);
        return store
          .dispatch(
            actions.deleteObject({
              objectType: 'scratch_org',
              object: org,
              shouldSubscribeToObject: () => true,
            }),
          )
          .then(() => {
            expect(window.socket.subscribe).toHaveBeenCalledTimes(1);
            expect(window.socket.subscribe).toHaveBeenCalledWith({
              model: 'scratch_org',
              id: 'org-id',
            });
          });
      });

      test('does not subscribe if test fails', () => {
        fetchMock.deleteOnce(url, 204);

        expect.assertions(1);
        return store
          .dispatch(
            actions.deleteObject({ objectType: 'scratch_org', object: org }),
          )
          .then(() => {
            expect(window.socket.subscribe).not.toHaveBeenCalled();
          });
      });
    });
  });

  test('throws error if no url', async () => {
    const store = storeWithThunk({});
    const payload = {
      objectType: 'foo',
      url: undefined,
      object: {},
    };
    const started = {
      type: 'DELETE_OBJECT_STARTED',
      payload,
    };
    const failed = {
      type: 'DELETE_OBJECT_FAILED',
      payload,
    };

    expect.assertions(1);
    try {
      await store.dispatch(
        actions.deleteObject({ objectType: 'foo', object: {} }),
      );
    } catch (error) {
      // ignore errors
    } finally {
      expect(store.getActions()).toEqual([started, failed]);
    }
  });

  describe('error', () => {
    test('dispatches DELETE_OBJECT_FAILED action', async () => {
      const store = storeWithThunk({});
      fetchMock.deleteOnce(url, 500);
      const started = {
        type: 'DELETE_OBJECT_STARTED',
        payload: objectPayload,
      };
      const failed = {
        type: 'DELETE_OBJECT_FAILED',
        payload: objectPayload,
      };

      expect.assertions(4);
      try {
        await store.dispatch(actions.deleteObject(objectPayload));
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('updateObject', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.epic_detail('epic-id');
    const epic = {
      id: 'epic-id',
    };
    objectPayload = {
      objectType: 'epic',
      url,
      data: { ...epic, foo: 'bar' },
    };
  });

  test('sends PUT to api', () => {
    const store = storeWithThunk({});
    fetchMock.putOnce(url, objectPayload.data);
    const started = {
      type: 'UPDATE_OBJECT_STARTED',
      payload: objectPayload,
    };
    const succeeded = {
      type: 'UPDATE_OBJECT_SUCCEEDED',
      payload: { ...objectPayload, object: objectPayload.data },
    };

    expect.assertions(1);
    return store.dispatch(actions.updateObject(objectPayload)).then(() => {
      expect(store.getActions()).toEqual([started, succeeded]);
    });
  });

  test('sends PATCH to api', () => {
    const store = storeWithThunk({});
    fetchMock.patchOnce(url, objectPayload.data);
    const started = {
      type: 'UPDATE_OBJECT_STARTED',
      payload: objectPayload,
    };
    const succeeded = {
      type: 'UPDATE_OBJECT_SUCCEEDED',
      payload: { ...objectPayload, object: objectPayload.data },
    };

    expect.assertions(1);
    return store
      .dispatch(actions.updateObject({ ...objectPayload, patch: true }))
      .then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
  });

  test('throws error if no url', async () => {
    const store = storeWithThunk({});
    const payload = {
      objectType: 'foo',
      url: undefined,
      data: {},
    };
    const started = {
      type: 'UPDATE_OBJECT_STARTED',
      payload,
    };
    const failed = {
      type: 'UPDATE_OBJECT_FAILED',
      payload,
    };

    expect.assertions(1);
    try {
      await store.dispatch(
        actions.updateObject({ objectType: 'foo', data: {} }),
      );
    } catch (error) {
      // ignore errors
    } finally {
      expect(store.getActions()).toEqual([started, failed]);
    }
  });

  describe('error', () => {
    test('dispatches UPDATE_OBJECT_FAILED action', async () => {
      const payload = { ...objectPayload, url: undefined };
      const store = storeWithThunk({});
      fetchMock.putOnce(url, 500);
      const started = {
        type: 'UPDATE_OBJECT_STARTED',
        payload: objectPayload,
      };
      const failed = {
        type: 'UPDATE_OBJECT_FAILED',
        payload: objectPayload,
      };

      expect.assertions(4);
      try {
        await store.dispatch(actions.updateObject(payload));
      } catch (error) {
        // ignore errors
      } finally {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
      }
    });
  });
});

describe('removeObject', () => {
  test('returns OBJECT_REMOVED action', () => {
    const epic = { id: 'epic-id' };
    const expected = { type: 'OBJECT_REMOVED', payload: epic };

    expect(actions.removeObject(epic)).toEqual(expected);
  });
});
