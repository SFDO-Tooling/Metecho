import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, StaticRouter } from 'react-router-dom';

import Login, { LoginButton } from '@/js/components/user/login';
import { addUrlParams } from '@/js/utils/api';
import routes from '@/js/utils/routes';

import { renderWithRedux } from './../../utils';

describe('<Login />', () => {
  describe('login click', () => {
    let location;

    beforeAll(() => {
      location = window.location;
      delete window.location;
      window.location = {
        assign: jest.fn(),
        pathname: location.pathname,
        origin: location.origin,
      };
    });

    afterAll(() => {
      window.location = location;
    });

    test('updates `window.location.href` on login click', () => {
      const { getByText } = renderWithRedux(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );
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
    let URLS, location;

    beforeAll(() => {
      location = window.location;
      delete window.location;
      window.location = {
        assign: jest.fn(),
        pathname: location.pathname,
        origin: location.origin,
      };
      URLS = window.api_urls;
      window.api_urls = {};
    });

    afterAll(() => {
      window.api_urls = URLS;
      window.location = location;
    });

    test('disables login btn', () => {
      const { getByText } = renderWithRedux(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );
      fireEvent.click(getByText('Log In With GitHub'));

      expect(window.location.assign).not.toHaveBeenCalled();
    });
  });
});
