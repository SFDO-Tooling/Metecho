import fetchMock from 'fetch-mock';

import getApiFetch, {
  addUrlParams,
  getUrlParam,
  removeUrlParam,
} from 'utils/api';

describe('apiFetch', () => {
  const apiFetch = getApiFetch();

  test('200: returns response', () => {
    const expected = { foo: 'bar' };
    fetchMock.getOnce('/test/url/', expected);

    return expect(apiFetch('/test/url/')).resolves.toEqual(expected);
  });

  test('404: returns null', () => {
    fetchMock.getOnce('/test/url/', 404);

    return expect(apiFetch('/test/url/')).resolves.toBeNull();
  });

  test('500: throws Error', () => {
    fetchMock.getOnce('/test/url/', 500);

    expect.assertions(1);
    return expect(apiFetch('/test/url/')).rejects.toThrow();
  });

  test('network error: throws Error', () => {
    fetchMock.getOnce('/test/url/', { throws: new Error('not cool') });

    expect.assertions(1);
    return expect(apiFetch('/test/url/')).rejects.toThrow('not cool');
  });

  test('string response: returns response', () => {
    const expected = 'foobar';
    fetchMock.getOnce('/test/url/', expected);

    return expect(apiFetch('/test/url/')).resolves.toEqual(expected);
  });
});

describe('addUrlParams', () => {
  test('adds params to url string', () => {
    const baseUrl = '/foobar?this=that';
    const expected = `${baseUrl}&this=other`;
    const actual = addUrlParams(baseUrl, { this: 'other' });

    return expect(actual).toBe(expected);
  });

  test('handles empty params', () => {
    const expected = '/foobar';
    const actual = addUrlParams('/foobar');

    return expect(actual).toBe(expected);
  });

  test('does not duplicate existing param', () => {
    const expected = '/foobar?this=that';
    const actual = addUrlParams(expected, { this: 'that' });

    return expect(actual).toBe(expected);
  });
});

describe('getUrlParam', () => {
  test('gets param from search string', () => {
    const input = '?foo=bar';
    const expected = 'bar';
    const actual = getUrlParam('foo', input);

    return expect(actual).toBe(expected);
  });

  test('handles missing param', () => {
    const actual = getUrlParam('foo');

    return expect(actual).toBeNull();
  });
});

describe('removeUrlParam', () => {
  test('removes param from search string', () => {
    const input = 'foo=bar&foo=buz&this=that';
    const expected = 'this=that';
    const actual = removeUrlParam('foo', input);

    return expect(actual).toBe(expected);
  });

  test('handles missing param', () => {
    const actual = removeUrlParam('foo');
    const expected = window.location.search;

    return expect(actual).toBe(expected);
  });
});
