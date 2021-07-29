import cookies from 'js-cookie';
import { ThunkDispatch } from 'redux-thunk';

import { addError } from '@/js/store/errors/actions';
import { logError } from '@/js/utils/logging';

export interface UrlParams {
  [key: string]: string | number | boolean;
}

export class ApiError extends Error {
  response?: Response;

  body?: string | { [key: string]: any };
}

// these HTTP methods do not require CSRF protection
const csrfSafeMethod = (method: string) =>
  /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);

const getResponse = (resp: Response): Promise<any> =>
  resp
    .text()
    .then((text) => {
      try {
        return { response: resp, body: JSON.parse(text) };
      } catch (err) {
        // swallow error
      }
      return { response: resp, body: text };
    })
    .catch(
      /* istanbul ignore next */
      (err) => {
        logError(err);
        throw err;
      },
    );

const apiFetch = async ({
  url,
  dispatch,
  opts = {},
  suppressErrorsOn = [404],
  hasForm = false,
}: {
  url: string;
  dispatch?: ThunkDispatch<any, any, any>;
  opts?: { [key: string]: any };
  suppressErrorsOn?: number[];
  hasForm?: boolean;
}) => {
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
        msg = `${msg}: ${body}`;
      } else if (body.detail) {
        msg = body.detail;
      } else if (body.non_field_errors) {
        msg = body.non_field_errors;
      } else {
        msg = `${msg}: ${JSON.stringify(body)}`;
      }
    }
    // If a `POST` or `PUT` returns `400`, suppress default error message to
    // show errors inline
    const suppressGlobalError =
      hasForm &&
      ['POST', 'PUT'].includes(options.method) &&
      response.status === 400;
    if (dispatch && !suppressGlobalError) {
      dispatch(addError(msg));
    }
    const error: ApiError = new Error(msg);
    error.response = response;
    error.body = body;
    throw error;
  } catch (err) {
    logError(err);
    throw err;
  }
};

// Based on https://fetch.spec.whatwg.org/#fetch-api
export const addUrlParams = (baseUrl: string, params: UrlParams = {}) => {
  const url = new URL(baseUrl, window.location.origin);
  Object.keys(params).forEach((key) => {
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
