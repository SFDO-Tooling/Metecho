import React from 'react';
import { MemoryRouter, StaticRouter } from 'react-router-dom';

import Login, { LoginButton } from '@/js/components/user/login';
import routes from '@/js/utils/routes';

import { renderWithRedux } from './../../utils';

describe('<Login />', () => {
  test('renders login form', () => {
    const { getByText } = renderWithRedux(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    expect(getByText('Log In With GitHub')).toBeVisible();
  });

  test('can use custom label and `from` path', () => {
    const { getByText } = renderWithRedux(
      <MemoryRouter>
        <LoginButton label="Hi" from={{ pathname: '/custom' }} />
      </MemoryRouter>,
    );

    expect(getByText('Hi')).toBeVisible();
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
