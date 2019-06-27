import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import Login, { LoginButton } from '@/components/login';
import { addUrlParams } from '@/utils/api';

describe('<Login />', () => {
  describe('login click', () => {
    test('updates `window.location.href` on login click', () => {
      const { getByText } = render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );
      jest.spyOn(window.location, 'assign');
      fireEvent.click(getByText('Log In With GitHub'));
      const base = window.api_urls.github_login();
      const expected = addUrlParams(base, { next: window.location.pathname });

      expect(window.location.assign).toHaveBeenCalledWith(expected);
    });

    test('can use custom "from" path and label', () => {
      const { getByText } = render(
        <MemoryRouter>
          <LoginButton label="Hi" from={{ pathname: '/custom' }} />
        </MemoryRouter>,
      );
      jest.spyOn(window.location, 'assign');
      fireEvent.click(getByText('Hi'));
      const base = window.api_urls.github_login();
      const expected = addUrlParams(base, { next: '/custom' });

      expect(window.location.assign).toHaveBeenCalledWith(expected);
    });
  });

  describe('GitHub URL not found', () => {
    let URLS;

    beforeAll(() => {
      URLS = window.api_urls;
      window.api_urls = {};
    });

    afterAll(() => {
      window.api_urls = URLS;
    });

    test('logs error to console', () => {
      const { getByText } = render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );
      jest.spyOn(window.location, 'assign');

      expect(window.console.error).toHaveBeenCalled();

      fireEvent.click(getByText('Log In With GitHub'));

      expect(window.location.assign).not.toHaveBeenCalled();
    });
  });
});
