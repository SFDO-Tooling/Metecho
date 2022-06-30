import { act } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import UserTasks from '@/js/components/user/userTasks';
import {
  selectProjectById,
  selectProjectCollaborator,
} from '@/js/store/projects/selectors';

import {
  sampleGitHubUser2,
  sampleTask7,
} from '../../../../src/stories/fixtures';
import {
  renderWithRedux,
  reRenderWithRedux,
  storeWithThunk,
} from '../../utils';

jest.mock('@/js/store/projects/selectors');
selectProjectById.mockReturnValue(sampleTask7.root_project);
selectProjectCollaborator.mockReturnValue(sampleGitHubUser2);

describe('<UserTasks />', () => {
  const setup = ({ rerender = null, store = null, results } = {}) => {
    fetchMock.get(
      {
        url: window.api_urls.task_list(),
        query: { assigned_to_me: true },
        overwriteRoutes: false,
      },
      {
        results,
      },
    );

    const ui = (
      <StaticRouter>
        <UserTasks />
      </StaticRouter>
    );
    const initialState = {
      user: sampleGitHubUser2,
    };
    if (rerender) {
      return reRenderWithRedux(ui, store, rerender);
    }
    return renderWithRedux(ui, initialState, storeWithThunk);
  };

  afterEach(() => {
    fetchMock.restore();
  });

  test('UserTasks does not render with 0 tasks', async () => {
    const { rerender, store, queryByText } = setup({ results: [] });

    await act(() => setup({ rerender, store }));

    expect(queryByText('Tasks With Unretrieved Changes')).toBeNull();
  });

  test('UserTasks renders with tasks', async () => {
    const { rerender, store, queryByText, queryByRole, getAllByRole } = setup({
      results: [sampleTask7],
    });

    await act(() => setup({ rerender, store }));

    expect(queryByText('Tasks With Unretrieved Changes')).toBeVisible();
    expect(queryByRole('table')).toBeVisible();
    expect(queryByText(sampleTask7.name)).toBeVisible();
    expect(
      getAllByRole('img', { title: sampleGitHubUser2.login }),
    ).toHaveLength(2);
  });
});
