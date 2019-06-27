import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import Login from '@/components/header/sfLogin';
import { addUrlParams } from '@/utils/api';

describe('<Login />', () => {
  describe('login click', () => {
    test('updates `window.location.href` on login click', () => {
      const { getByText } = render(<Login />);
      jest.spyOn(window.location, 'assign');
      fireEvent.click(getByText('Log In'));
      fireEvent.click(getByText('Sandbox or Scratch Org'));
      const base = window.api_urls.salesforce_test_login();
      const expected = addUrlParams(base, { next: window.location.pathname });

      expect(window.location.assign).toHaveBeenCalledWith(expected);
    });
  });

  describe('custom domain click', () => {
    test('opens modal', () => {
      const { getByText, getByLabelText } = render(<Login label="Hi" />);
      fireEvent.click(getByText('Hi'));
      fireEvent.click(getByText('Use Custom Domain'));

      expect(getByLabelText('Custom Domain')).toBeVisible();
    });
  });

  describe('URLs not found', () => {
    let URLS;

    beforeAll(() => {
      URLS = window.api_urls;
      window.api_urls = {};
    });

    afterAll(() => {
      window.api_urls = URLS;
    });

    test('logs error to console', () => {
      const { getByText, queryByLabelText } = render(<Login />);

      expect(window.console.error).toHaveBeenCalled();

      fireEvent.click(getByText('Log In'));
      fireEvent.click(getByText('Use Custom Domain'));

      expect(queryByLabelText('Custom Domain')).toBeNull();
    });
  });
});
