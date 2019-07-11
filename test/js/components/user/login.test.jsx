import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, StaticRouter } from 'react-router-dom';

import Login, { LoginButton } from '@/components/user/login';
import { addUrlParams } from '@/utils/api';
import routes from '@/utils/routes';

import { renderWithRedux } from './../../utils';

describe('<Login />', () => {
  describe('login click', () => {
    test('updates `window.location.href` on login click', () => {
      const { getByText } = renderWithRedux(
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

    test('can use custom label and `from` path', () => {
      const { getByText } = renderWithRedux(
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

    test('can use `location.state.from` path', () => {
      const { getByText } = renderWithRedux(
        <StaticRouter location={{ state: { from: { pathname: '/custom' } } }}>
          <LoginButton />
        </StaticRouter>,
      );
      jest.spyOn(window.location, 'assign');
      fireEvent.click(getByText('Log In With GitHub'));
      const base = window.api_urls.github_login();
      const expected = addUrlParams(base, { next: '/custom' });

      expect(window.location.assign).toHaveBeenCalledWith(expected);
    });
  });

  describe('already logged in', () => {
    test('redirects to home page', () => {
      const context = {};
      renderWithRedux(
        <StaticRouter context={context}>
          <Login />
        </StaticRouter>,
        { user: {} },
      );

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(routes.home());
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

    test('disables login btn', () => {
      const { getByText } = renderWithRedux(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );
      jest.spyOn(window.location, 'assign');
      fireEvent.click(getByText('Log In With GitHub'));

      expect(window.location.assign).not.toHaveBeenCalled();
    });
  });
});
