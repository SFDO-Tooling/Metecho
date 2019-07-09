import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import AuthError from '@/components/user/authError';

import { renderWithRedux } from './../utils';

describe('<AuthError />', () => {
  test('renders msg with link', () => {
    const { getByText } = renderWithRedux(
      <MemoryRouter>
        <AuthError />
      </MemoryRouter>,
    );

    expect(getByText('home page')).toBeVisible();
  });

  describe('logged in', () => {
    test('renders log in btn', () => {
      const { getByText } = renderWithRedux(
        <MemoryRouter>
          <AuthError />
        </MemoryRouter>,
        { user: {} },
      );

      expect(getByText('Log In With a Different Account')).toBeVisible();
    });
  });
});
