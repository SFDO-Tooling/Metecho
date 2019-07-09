import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import Header from '@/components/header';

import { renderWithRedux } from './../../utils';

describe('<Header />', () => {
  const setup = (
    initialState = {
      user: { username: 'Test User' },
      socket: false,
      errors: [],
    },
  ) => {
    const {
      container,
      getByLabelText,
      getByText,
      queryByText,
    } = renderWithRedux(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
      initialState,
    );
    return { container, getByLabelText, getByText, queryByText };
  };

  describe('logged out', () => {
    test('renders nothing', () => {
      const { queryByText } = setup({ user: null, socket: true });

      expect(queryByText('Log In')).toBeNull();
    });
  });

  describe('logged in', () => {
    test('renders profile info and logout', () => {
      const { getByText } = setup();

      expect(getByText('Test User')).toBeVisible();
      expect(getByText('Log Out')).toBeVisible();
    });
  });

  describe('offline', () => {
    test('renders OfflineAlert if websocket disconnected', () => {
      const { getByText } = setup();

      expect(getByText('reload the page.')).toBeVisible();
    });

    test('does not render OfflineAlert if websocket connected', () => {
      const initialState = { user: {}, socket: true };
      const { queryByText } = setup(initialState);

      expect(queryByText('reload the page.')).toBeNull();
    });
  });
});
