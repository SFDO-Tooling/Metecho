import useScrollPosition from '@react-hook/window-scroll';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import ProjectList from '@/js/components/projects/list';
import { fetchObjects } from '@/js/store/actions';
import { refreshProjects } from '@/js/store/projects/actions';

import {
  renderWithRedux,
  reRenderWithRedux,
  storeWithThunk,
} from './../../utils';

jest.mock('@react-hook/window-scroll');
jest.mock('@/js/store/actions');
jest.mock('@/js/store/projects/actions');

fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
refreshProjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
useScrollPosition.mockReturnValue(0);

afterEach(() => {
  fetchObjects.mockClear();
  refreshProjects.mockClear();
});

describe('<ProjectList />', () => {
  const setup = ({
    initialState = {
      projects: { projects: [], notFound: [], next: null },
    },
    props = {},
    rerender = null,
    store,
  } = {}) => {
    const ui = (
      <MemoryRouter>
        <ProjectList {...props} />
      </MemoryRouter>
    );
    if (rerender) {
      return reRenderWithRedux(ui, store, rerender);
    }
    return renderWithRedux(ui, initialState, storeWithThunk);
  };

  test('renders projects list (empty)', () => {
    const { getByText } = setup();

    expect(getByText('¯\\_(ツ)_/¯')).toBeVisible();
  });

  test('renders projects list', () => {
    const initialState = {
      projects: {
        projects: [
          {
            id: 'r1',
            name: 'Project 1',
            slug: 'project-1',
            description: 'This is a test project.',
            description_rendered: '<p>This is a test project.</p>',
            repo_url: 'https://github.com/test/test-repo',
          },
        ],
        notFound: [],
        next: null,
      },
    };
    const { getByText } = setup({ initialState });

    expect(getByText('Project 1')).toBeVisible();
    expect(getByText('This is a test project.')).toBeVisible();
  });

  describe('fetching more projects', () => {
    const initialState = {
      projects: {
        projects: [
          {
            id: 'r1',
            name: 'Project 1',
            slug: 'project-1',
            description: 'This is a test project.',
            description_rendered: '<p>This is a test project.</p>',
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
      window.sessionStorage.removeItem('activeProjectsTab');
    });

    test('fetches next page of projects', async () => {
      fetchObjects.mockReturnValueOnce(() => new Promise(() => {}));
      const { findByText, rerender, store } = setup({ initialState });
      useScrollPosition.mockReturnValueOnce(1000);
      setup({ rerender, store });

      expect.assertions(1);
      await findByText('Loading…');

      expect(fetchObjects).toHaveBeenCalledWith({
        url: 'next-url',
        objectType: 'project',
      });
    });

    test('does not fetch next page if no more projects', () => {
      const state = {
        ...initialState,
        projects: {
          ...initialState.projects,
          next: null,
        },
      };
      const { rerender, queryByText, store } = setup({ initialState: state });
      useScrollPosition.mockReturnValueOnce(1000);
      setup({ rerender, store });

      expect(queryByText('Loading…')).toBeNull();
      expect(fetchObjects).not.toHaveBeenCalled();
    });
  });

  describe('sync projects clicked', () => {
    test('syncs projects', () => {
      const { getByText } = setup();
      const btn = getByText('Re-Sync Projects');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(refreshProjects).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncing projects', () => {
    test('displays button as loading', () => {
      const { getByText } = setup({
        initialState: {
          projects: {
            projects: [],
            notFound: [],
            next: null,
            refreshing: true,
          },
        },
      });

      expect(getByText('Syncing Projects…')).toBeVisible();
    });
  });
});
