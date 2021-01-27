import '@testing-library/jest-dom/extend-expect';

import fetchMock from 'fetch-mock';

import { api_urls } from '../../src/stories/fixtures';

beforeAll(() => {
  document.createRange = () => ({
    setStart: jest.fn(),
    setEnd: jest.fn(),
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
  });
  window.api_urls = api_urls;
  window.GLOBALS = {};
  window.console.error = jest.fn();
  window.console.warn = jest.fn();
  window.console.info = jest.fn();
});

afterEach(fetchMock.reset);
