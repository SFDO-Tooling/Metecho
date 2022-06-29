import { fireEvent } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import DeleteAccount from '@/js/components/user/delete';

import { renderWithRedux, storeWithThunk } from '../../utils';

describe('<DeleteAccount /> tests', () => {
  const setup = (
    initialState = {
      user: { username: 'Test User' },
    },
  ) => {
    const result = renderWithRedux(
      <MemoryRouter>
        <DeleteAccount />
      </MemoryRouter>,
      initialState,
      storeWithThunk,
    );

    return result;
  };

  beforeEach(() => {
    fetchMock.get(
      {
        url: window.api_urls.task_list(),
        query: { assigned_to_me: true },
      },
      {
        results: [],
      },
    );
  });

  test('Delete Account button renders', () => {
    const { getByRole } = setup();

    expect(getByRole('button', { name: 'Delete Account' })).toBeVisible();
  });

  test('Delete Account modal renders', () => {
    const { getByRole, getByText, getByTitle, queryByText } = setup();
    fireEvent.click(getByRole('button', { name: 'Delete Account' }));

    expect(getByText('Confirm Deleting Account')).toBeVisible();

    fireEvent.click(getByTitle('Cancel'));

    expect(queryByText('Confirm Deleting Account')).toBeNull();
  });
});
