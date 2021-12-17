import React from 'react';
import { MemoryRouter, StaticRouter } from 'react-router-dom';

import Login, { LoginButton } from '@/js/components/user/login';
import routes from '@/js/utils/routes';

import { renderWithRedux } from './../../utils';

describe('<Login />', () => {
  test('renders login form', () => {
    const { getByText, getByTestId } = renderWithRedux(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    expect(getByText('Log In With GitHub')).toBeVisible();
    expect(getByTestId('gh-login-next')).toHaveValue(window.location.pathname);
  });

  test('can use custom label and `from` path', () => {
    const { getByText, getByTestId } = renderWithRedux(
      <MemoryRouter>
        <LoginButton label="Hi" from={{ pathname: '/custom' }} />
      </MemoryRouter>,
    );

    expect(getByText('Hi')).toBeVisible();
    expect(getByTestId('gh-login-next')).toHaveValue('/custom');
  });

  test('can use `location.state.from` path', () => {
    const { getByTestId } = renderWithRedux(
      <StaticRouter location={{ state: { from: { pathname: '/custom' } } }}>
        <LoginButton />
      </StaticRouter>,
    );

    expect(getByTestId('gh-login-next')).toHaveValue('/custom');
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

      expect(context.action).toBe('REPLACE');
      expect(context.url).toEqual(routes.home());
    });
  });
});
