import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import Header from '~js/components/header';

import { renderWithRedux } from './../utils';

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
      const { container } = setup({ user: null, socket: true });

      expect(container).toBeEmptyDOMElement();
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

  test('show tour help', () => {
    const { getByText } = setup();
    fireEvent.click(getByText('Plan Walkthrough'));
  });
});
