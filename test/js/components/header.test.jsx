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
      findByText,
    } = renderWithRedux(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
      initialState,
    );
    return { container, getByLabelText, getByText, queryByText, findByText };
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

  test('show tour help', async () => {
    const { getByText, findByText } = setup({
      user: { onboarded_at: 'Today' },
      page: '/projects/foo',
    });

    fireEvent.click(getByText('Get Help'));

    fireEvent.click(getByText('Plan Walkthrough', { exact: false }));
    const dialog = await findByText(
      'Epics are groups of related Tasks, representing larger changes to the Project. You can invite multiple collaborators to your Epic and assign different people as Developers and Testers for each Task.',
      { exact: false },
    );
    expect(dialog).toBeVisible();
  });
});
