import { ThunkResult } from '@/store';
import apiFetch, { addUrlParams } from '@/utils/api';
import { ObjectTypes } from '@/utils/constants';

interface CreateObjectPayload {
  objectType: ObjectTypes;
  url: string;
}
interface ObjectPayload extends CreateObjectPayload {
  filters: ObjectFilters;
  reset?: boolean;
}
interface ObjectFilters {
  [key: string]: string;
}
interface ObjectData {
  [key: string]: any;
}
type ObjectResponse = any[];
export interface PaginatedObjectResponse {
  next: string | null;
  results: ObjectResponse;
}

interface FetchObjectsStarted {
  type: 'FETCH_OBJECTS_STARTED';
  payload: ObjectPayload;
}
interface FetchObjectsSucceeded {
  type: 'FETCH_OBJECTS_SUCCEEDED';
  payload: {
    response: PaginatedObjectResponse | ObjectResponse;
  } & ObjectPayload;
}
interface FetchObjectsFailed {
  type: 'FETCH_OBJECTS_FAILED';
  payload: ObjectPayload;
}
interface FetchObjectStarted {
  type: 'FETCH_OBJECT_STARTED';
  payload: ObjectPayload;
}
interface FetchObjectSucceeded {
  type: 'FETCH_OBJECT_SUCCEEDED';
  payload: { object: any } & ObjectPayload;
}
interface FetchObjectFailed {
  type: 'FETCH_OBJECT_FAILED';
  payload: ObjectPayload;
}
interface CreateObjectStarted {
  type: 'CREATE_OBJECT_STARTED';
  payload: { data: ObjectData } & CreateObjectPayload;
}
interface CreateObjectSucceeded {
  type: 'CREATE_OBJECT_SUCCEEDED';
  payload: {
    data: ObjectData;
    object: any;
  } & CreateObjectPayload;
}
interface CreateObjectFailed {
  type: 'CREATE_OBJECT_FAILED';
  payload: { data: ObjectData } & CreateObjectPayload;
}
interface DeleteObjectAction {
  type:
    | 'DELETE_OBJECT_STARTED'
    | 'DELETE_OBJECT_SUCCEEDED'
    | 'DELETE_OBJECT_FAILED';
  payload: { object: any } & CreateObjectPayload;
}

export type ObjectsAction =
  | FetchObjectsStarted
  | FetchObjectsSucceeded
  | FetchObjectsFailed
  | FetchObjectStarted
  | FetchObjectSucceeded
  | FetchObjectFailed
  | CreateObjectStarted
  | CreateObjectSucceeded
  | CreateObjectFailed
  | DeleteObjectAction;

export type ObjectsActionType = ({
  objectType,
  data,
  url,
  reset,
  filters,
}: {
  objectType: ObjectTypes;
  data?: ObjectData;
  url?: string;
  reset?: boolean;
  filters?: ObjectFilters;
}) => Promise<any>;

export const fetchObjects = ({
  objectType,
  url,
  filters = {},
  reset = false,
  shouldSubscribeToObject = () => false,
}: {
  objectType: ObjectTypes;
  url?: string;
  filters?: ObjectFilters;
  reset?: boolean;
  shouldSubscribeToObject?: (response: any) => boolean;
}): ThunkResult => async dispatch => {
  const urlFn = window.api_urls[`${objectType}_list`];
  let baseUrl;
  if (url || urlFn) {
    baseUrl = url || urlFn();
  }
  dispatch({
    type: 'FETCH_OBJECTS_STARTED',
    payload: { objectType, url: baseUrl, reset, filters },
  });
  try {
    if (!baseUrl) {
      throw new Error(`No URL found for object: ${objectType}`);
    }
    const response = await apiFetch({
      url: addUrlParams(baseUrl, { ...filters }),
      dispatch,
    });
    if (window.socket) {
      const arr = Array.isArray(response) ? response : response.results;
      for (const object of arr) {
        if (shouldSubscribeToObject(object) && object && object.id) {
          window.socket.subscribe({
            model: objectType,
            id: object.id,
          });
        }
      }
    }
    return dispatch({
      type: 'FETCH_OBJECTS_SUCCEEDED',
      payload: { response, objectType, url: baseUrl, reset, filters },
    });
  } catch (err) {
    dispatch({
      type: 'FETCH_OBJECTS_FAILED',
      payload: { objectType, url: baseUrl, reset, filters },
    });
    throw err;
  }
};

export const fetchObject = ({
  objectType,
  url,
  filters = {},
}: {
  objectType: ObjectTypes;
  url?: string;
  filters?: ObjectFilters;
}): ThunkResult => async dispatch => {
  const urlFn = window.api_urls[`${objectType}_list`];
  let baseUrl;
  if (url || urlFn) {
    baseUrl = url || urlFn();
  }
  dispatch({
    type: 'FETCH_OBJECT_STARTED',
    payload: { objectType, url: baseUrl, filters },
  });
  try {
    if (!baseUrl) {
      throw new Error(`No URL found for object: ${objectType}`);
    }
    const response = await apiFetch({
      url: addUrlParams(baseUrl, { ...filters }),
      dispatch,
    });
    const object =
      response && response.results && response.results.length
        ? response.results[0]
        : null;
    return dispatch({
      type: 'FETCH_OBJECT_SUCCEEDED',
      payload: { object, filters, objectType, url: baseUrl },
    });
  } catch (err) {
    dispatch({
      type: 'FETCH_OBJECT_FAILED',
      payload: { filters, objectType, url: baseUrl },
    });
    throw err;
  }
};

export const createObject = ({
  objectType,
  data = {},
  hasForm = false,
  shouldSubscribeToObject = () => false,
}: {
  objectType: ObjectTypes;
  data?: ObjectData;
  hasForm?: boolean;
  shouldSubscribeToObject?: (object: any) => boolean;
}): ThunkResult => async dispatch => {
  const urlFn = window.api_urls[`${objectType}_list`];
  let baseUrl;
  if (urlFn) {
    baseUrl = urlFn();
  }
  dispatch({
    type: 'CREATE_OBJECT_STARTED',
    payload: { objectType, url: baseUrl, data },
  });
  try {
    if (!baseUrl) {
      throw new Error(`No URL found for object: ${objectType}`);
    }
    const object = await apiFetch({
      url: baseUrl,
      dispatch,
      opts: {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      hasForm,
    });
    if (
      shouldSubscribeToObject(object) &&
      object &&
      object.id &&
      window.socket
    ) {
      window.socket.subscribe({
        model: objectType,
        id: object.id,
      });
    }
    return dispatch({
      type: 'CREATE_OBJECT_SUCCEEDED',
      payload: { data, object, url: baseUrl, objectType },
    });
  } catch (err) {
    dispatch({
      type: 'CREATE_OBJECT_FAILED',
      payload: { objectType, url: baseUrl, data },
    });
    throw err;
  }
};

export const deleteObject = ({
  objectType,
  object,
  shouldSubscribeToObject = () => false,
}: {
  objectType: ObjectTypes;
  object: { id: string; [key: string]: any };
  shouldSubscribeToObject?: (object: any) => boolean;
  // @@@
  // eslint-disable-next-line require-await
}): ThunkResult => async dispatch => {
  const urlFn = window.api_urls[`${objectType}_detail`];
  let baseUrl;
  if (urlFn && object.id) {
    baseUrl = urlFn(object.id);
  }
  dispatch({
    type: 'DELETE_OBJECT_STARTED',
    payload: { objectType, url: baseUrl, object },
  });
  try {
    if (!baseUrl) {
      throw new Error(`No URL found for object: ${objectType}`);
    }
    // @@@ Mock out until API exists
    // await apiFetch({
    //   url: baseUrl,
    //   dispatch,
    //   opts: { method: 'DELETE' },
    // });
    setTimeout(() => {
      dispatch({
        type: 'SCRATCH_ORG_DELETED',
        payload: { ...object },
      });
    }, 3000);
    if (shouldSubscribeToObject(object) && window.socket) {
      window.socket.subscribe({
        model: objectType,
        id: object.id,
      });
    }
    return dispatch({
      type: 'DELETE_OBJECT_SUCCEEDED',
      payload: { objectType, url: baseUrl, object },
    });
  } catch (err) {
    dispatch({
      type: 'DELETE_OBJECT_FAILED',
      payload: { objectType, url: baseUrl, object },
    });
    throw err;
  }
};
