import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import AuthError from '@/js/components/user/authError';

import { renderWithRedux } from './../../utils';

describe('<AuthError />', () => {
  test('renders msg with link', () => {
    const { getByText } = renderWithRedux(
      <MemoryRouter>
        <AuthError />
      </MemoryRouter>,
    );

    expect(getByText('home page')).toBeVisible();
    expect(getByText('Log In With GitHub')).toBeVisible();
  });

  describe('logged in', () => {
    test('renders log out btn', () => {
      const { getByText } = renderWithRedux(
        <MemoryRouter>
          <AuthError />
        </MemoryRouter>,
        { user: {} },
      );

      expect(getByText('Log Out')).toBeVisible();
    });
  });
});
