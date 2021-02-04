import '@testing-library/jest-dom/extend-expect';

import settings from '@salesforce/design-system-react/components/settings';
import fetchMock from 'fetch-mock';

import { api_urls } from '../../src/stories/fixtures';
import { initI18n } from './utils';

beforeAll(() => {
  settings.setAppElement(document.documentElement);
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
  window.open = jest.fn();
  window.console.error = jest.fn();
  window.console.warn = jest.fn();
  window.console.info = jest.fn();
  initI18n();
});

afterEach(() => fetchMock.reset());
