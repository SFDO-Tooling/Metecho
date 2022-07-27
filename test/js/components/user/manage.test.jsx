import fetchMock from 'fetch-mock';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import Manage from '@/js/components/user/manage';

import { renderWithRedux, storeWithThunk } from '../../utils';

describe('<Manage /> tests', () => {
  const setup = (
    initialState = {
      user: { username: 'Test User' },
    },
  ) => {
    const result = renderWithRedux(
      <MemoryRouter>
        <Manage />
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

  test('Manage Account heading renders', () => {
    const { getByRole } = setup();

    expect(
      getByRole('heading', { level: 1, name: 'Manage Account' }),
    ).toBeVisible();
  });

  test('Manage Account breadcrumb renders', () => {
    const result = setup();
    const breadCrumb = result.container.querySelector('.slds-breadcrumb');

    expect(breadCrumb).toBeVisible();
  });
});
