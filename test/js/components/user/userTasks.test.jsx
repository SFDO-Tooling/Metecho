import { fireEvent } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import UserTasks from '@/js/components/user/userTasks';
import { selectProjectById } from '@/js/store/projects/selectors';

import {
  sampleGitHubUser1,
  sampleTask1,
  sampleTask2,
} from '../../../../src/stories/fixtures';
import { renderWithRedux, storeWithThunk } from '../../utils';

jest.mock('@/js/store/projects/selectors');

selectProjectById.mockReturnValue(sampleTask1.root_project);

describe('<UserTasks />', () => {
  const setup = (payload = {}) => {
    fetchMock.get(
      {
        url: window.api_urls.task_list(),
        query: { assigned_to_me: true },
      },
      payload,
    );

    const ui = (
      <StaticRouter>
        <UserTasks />
      </StaticRouter>
    );
    const initialState = {
      user: sampleGitHubUser1,
    };
    return renderWithRedux(ui, initialState, storeWithThunk);
  };

  afterEach(() => {
    fetchMock.restore();
  });

  test('does not render with no tasks', () => {
    const { queryByText } = setup({ results: [], count: 0 });

    expect(queryByText('Your Tasks')).toBeNull();
  });

  test('renders with tasks', async () => {
    const { findByText, getByText, getByRole } = setup({
      results: [sampleTask1],
      count: 1,
    });

    await findByText('Your Tasks');
    expect(getByText(sampleTask1.name)).toBeVisible();
    expect(getByRole('img', { title: sampleGitHubUser1.login })).toBeVisible();
  });

  test('fetches next page of tasks', async () => {
    const next = '/next/url';
    const { findByText, getByText, queryByText } = setup({
      results: [sampleTask1],
      count: 2,
      next,
    });

    await findByText('Load More');

    fetchMock.get(next, { results: [sampleTask2], count: 2 });
    fireEvent.click(getByText('Load More'));

    await findByText('Loading…');
    await findByText(sampleTask2.name);

    expect(getByText(sampleTask1.name)).toBeVisible();
    expect(getByText(sampleTask2.name)).toBeVisible();
    expect(queryByText('Load More')).toBeNull();
  });
});
