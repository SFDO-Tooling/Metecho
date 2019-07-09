import cookies from 'js-cookie';
import { ThunkDispatch } from 'redux-thunk';

import { addError } from '@/store/errors/actions';
import { logError } from '@/utils/logging';

export interface UrlParams {
  [key: string]: string | number | boolean;
}

class ApiError extends Error {
  public response?: Response;
}

// these HTTP methods do not require CSRF protection
const csrfSafeMethod = (method: string) =>
  /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);

const getResponse = (resp: Response): Promise<any> =>
  resp
    .text()
    .then(text => {
      try {
        return { response: resp, body: JSON.parse(text) };
      } catch (err) {
        // swallow error
      }
      return { response: resp, body: text };
    })
    .catch(
      /* istanbul ignore next */
      err => {
        logError(err);
        throw err;
      },
    );

const apiFetch = async (
  url: string,
  dispatch: ThunkDispatch<any, any, any>,
  opts: { [key: string]: any } = {},
  suppressErrorsOn: number[] = [404],
) => {
  const options = Object.assign({}, { headers: {} }, opts);
  const method = options.method || 'GET';
  if (!csrfSafeMethod(method)) {
    (options.headers as { [key: string]: any })['X-CSRFToken'] =
      cookies.get('csrftoken') || '';
  }

  try {
    const resp = await fetch(url, options);
    const { response, body } = await getResponse(resp);
    if (response.ok) {
      return body;
    }
    if (suppressErrorsOn.includes(response.status)) {
      return null;
    }
    let msg = response.statusText;
    if (body) {
      if (typeof body === 'string') {
        msg = body;
      } else if (body.detail) {
        msg = body.detail;
      } else if (body.non_field_errors) {
        msg = body.non_field_errors;
      }
    }
    const error: ApiError = new Error(msg);
    error.response = response;
    throw error;
  } catch (err) {
    logError(err);
    dispatch(addError(err.message));
    throw err;
  }
};

// Based on https://fetch.spec.whatwg.org/#fetch-api
export const addUrlParams = (baseUrl: string, params: UrlParams = {}) => {
  const url = new URL(baseUrl, window.location.origin);
  Object.keys(params).forEach(key => {
    const value = params[key].toString();
    // Disallow duplicate params with the same key:value
    if (url.searchParams.get(key) !== value) {
      url.searchParams.append(key, value);
    }
  });
  return url.pathname + url.search + url.hash;
};

export const getUrlParam = (key: string, search?: string) =>
  new URLSearchParams(search || window.location.search).get(key);

export const removeUrlParam = (key: string, search?: string) => {
  const params = new URLSearchParams(search || window.location.search);
  // This deletes _all_ occurrences of the given key
  params.delete(key);
  return params.toString();
};

export default apiFetch;
