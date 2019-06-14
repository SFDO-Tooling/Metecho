import 'isomorphic-fetch';
import 'jest-dom/extend-expect';
import '@testing-library/react/cleanup-after-each';
import fetchMock from 'fetch-mock';

beforeAll(() => {
  document.createRange = () => ({
    setStart: jest.fn(),
    setEnd: jest.fn(),
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
  });
  window.api_urls = {
    account_logout: () => '/accounts/logout/',
    salesforce_custom_login: () => '/accounts/salesforce-custom/login/',
    salesforce_production_login: () => '/accounts/salesforce-production/login/',
    salesforce_test_login: () => '/accounts/salesforce-test/login/',
    user: () => '/api/user/',
  };
  window.GLOBALS = {};
  window.console.error = jest.fn();
  window.console.warn = jest.fn();
  window.console.info = jest.fn();
});

afterEach(fetchMock.reset);
