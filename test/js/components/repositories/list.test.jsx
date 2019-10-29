import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import RepositoryList from '@/components/repositories/list';
import { fetchObjects } from '@/store/actions';
import { refreshRepos } from '@/store/repositories/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('react-fns', () => ({
  withScroll(Component) {
    // eslint-disable-next-line react/display-name
    return (props) => <Component x={0} y={0} {...props} />;
  },
}));
jest.mock('@/store/actions');
jest.mock('@/store/repositories/actions');
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
refreshRepos.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObjects.mockClear();
  refreshRepos.mockClear();
});

describe('<RepositoryList />', () => {
  const setup = ({
    initialState = {
      repositories: { repositories: [], notFound: [], next: null },
    },
    props = {},
    rerender = null,
    store,
  } = {}) =>
    renderWithRedux(
      <MemoryRouter>
        <RepositoryList {...props} />
      </MemoryRouter>,
      initialState,
      storeWithThunk,
      rerender,
      store,
    );

  test('renders repositories list (empty)', () => {
    const { getByText } = setup();

    expect(getByText('¯\\_(ツ)_/¯')).toBeVisible();
  });

  test('renders repositories list', () => {
    const initialState = {
      repositories: {
        repositories: [
          {
            id: 'r1',
            name: 'Repository 1',
            slug: 'repository-1',
            description: 'This is a test repository.',
            repo_url: 'https://github.com/test/test-repo',
          },
        ],
        notFound: [],
        next: null,
      },
    };
    const { getByText } = setup({ initialState });

    expect(getByText('Repository 1')).toBeVisible();
    expect(getByText('This is a test repository.')).toBeVisible();
  });

  describe('fetching more repositories', () => {
    const initialState = {
      repositories: {
        repositories: [
          {
            id: 'r1',
            name: 'Repository 1',
            slug: 'repository-1',
            description: 'This is a test repository.',
            repo_url: 'https://github.com/test/test-repo',
          },
        ],
        notFound: [],
        next: 'next-url',
      },
    };

    beforeAll(() => {
      jest
        .spyOn(document.documentElement, 'scrollHeight', 'get')
        .mockImplementation(() => 1100);
    });

    afterEach(() => {
      window.sessionStorage.removeItem('activeRepositoriesTab');
    });

    test('fetches next page of repositories', () => {
      const { rerender, getByText, store } = setup({ initialState });
      setup({ props: { y: 1000 }, rerender, store });

      expect(getByText('Loading…')).toBeVisible();
      expect(fetchObjects).toHaveBeenCalledWith({
        url: 'next-url',
        objectType: 'repository',
      });
    });

    test('does not fetch next page if no more repositories', () => {
      const state = {
        ...initialState,
        repositories: {
          ...initialState.repositories,
          next: null,
        },
      };
      const { rerender, queryByText, store } = setup({ initialState: state });

      setup({ props: { y: 1000 }, rerender, store });

      expect(queryByText('Loading…')).toBeNull();
      expect(fetchObjects).not.toHaveBeenCalled();
    });
  });

  describe('sync repos clicked', () => {
    test('syncs repos', () => {
      const { getByText } = setup();
      const btn = getByText('Sync GitHub Repositories');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(refreshRepos).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncing repos', () => {
    test('displays button as loading', () => {
      const { getByText } = setup({
        initialState: {
          repositories: {
            repositories: [],
            notFound: [],
            next: null,
            refreshing: true,
          },
        },
      });

      expect(getByText('Syncing GitHub Repos…')).toBeVisible();
    });
  });
});
