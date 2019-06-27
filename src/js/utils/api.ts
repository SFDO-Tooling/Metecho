import cookies from 'js-cookie';

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
        return JSON.parse(text);
      } catch (err) {
        // swallow error
      }
      return text;
    })
    .catch(
      /* istanbul ignore next */
      err => {
        logError(err);
        throw err;
      },
    );

const apiFetch = async (url: string, opts: { [key: string]: any } = {}) => {
  const options = Object.assign({}, { headers: {} }, opts);
  const method = options.method || 'GET';
  if (!csrfSafeMethod(method)) {
    (options.headers as { [key: string]: any })['X-CSRFToken'] =
      cookies.get('csrftoken') || '';
  }

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return getResponse(response);
    }
    if (response.status >= 400 && response.status < 500) {
      return null;
    }
    const error: ApiError = new Error(response.statusText);
    error.response = response;
    throw error;
  } catch (err) {
    logError(err);
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
