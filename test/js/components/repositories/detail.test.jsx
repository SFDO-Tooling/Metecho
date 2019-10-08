import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import RepoDetail from '@/components/repositories/detail';
import { fetchObject, fetchObjects } from '@/store/actions';
import routes from '@/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');

fetchObject.mockReturnValue({ type: 'TEST' });
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObject.mockClear();
  fetchObjects.mockClear();
});

const defaultState = {
  repositories: {
    repositories: [
      {
        id: 'r1',
        name: 'Repository 1',
        slug: 'repository-1',
        old_slugs: ['old-slug'],
        description: 'This is a test repository.',
        repo_url: 'https://www.github.com/test/test-repo',
      },
    ],
    notFound: ['yet-another-repository'],
    next: null,
  },
  projects: {
    r1: {
      projects: [
        {
          id: 'project1',
          slug: 'project-1',
          name: 'Project 1',
          repository: 'r1',
          description: 'Project Description',
        },
      ],
      next: 'next-url',
      notFound: [],
      fetched: true,
    },
  },
};

describe('<RepoDetail />', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      repositorySlug: 'repository-1',
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, repositorySlug } = opts;
    const context = {};
    const { getByText, getByTitle, queryByText } = renderWithRedux(
      <StaticRouter context={context}>
        <RepoDetail match={{ params: { repositorySlug } }} />
      </StaticRouter>,
      initialState,
      storeWithThunk,
    );
    return { getByText, getByTitle, queryByText, context };
  };

  test('renders repository detail and projects list', () => {
    const { getByText, getByTitle } = setup();

    expect(getByTitle('Repository 1')).toBeVisible();
    expect(getByText('This is a test repository.')).toBeVisible();
    expect(getByText('Project 1')).toBeVisible();
    expect(getByText('Projects for Repository 1')).toBeVisible();
  });

  test('renders with form expanded if no projects', () => {
    const { getByText, queryByText } = setup({
      initialState: {
        ...defaultState,
        projects: {
          r1: {
            projects: [],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
      },
    });

    expect(getByText('Create a Project for Repository 1')).toBeVisible();
    expect(queryByText('Projects for Repository 1')).toBeNull();
  });

  describe('repository not found', () => {
    test('fetches repository from API', () => {
      const { queryByText } = setup({ repositorySlug: 'other-repository' });

      expect(queryByText('Repository 1')).toBeNull();
      expect(fetchObject).toHaveBeenCalledWith({
        filters: { slug: 'other-repository' },
        objectType: 'repository',
      });
    });
  });

  describe('repository does not exist', () => {
    test('renders <RepositoryNotFound />', () => {
      const { getByText, queryByText } = setup({
        repositorySlug: 'yet-another-repository',
      });

      expect(queryByText('Repository 1')).toBeNull();
      expect(getByText('list of all repositories')).toBeVisible();
    });
  });

  describe('old repository slug', () => {
    test('redirects to repository_detail with new slug', () => {
      const { context } = setup({ repositorySlug: 'old-slug' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(routes.repository_detail('repository-1'));
    });
  });

  describe('no repository slug', () => {
    test('renders <RepositoryNotFound />', () => {
      const { getByText, queryByText } = setup({ repositorySlug: '' });

      expect(queryByText('Repository 1')).toBeNull();
      expect(getByText('list of all repositories')).toBeVisible();
    });
  });

  describe('projects have not been fetched', () => {
    test('fetches projects from API', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            r1: {
              projects: [],
              next: null,
              notFound: [],
              fetched: false,
            },
          },
        },
      });

      expect(queryByText('Projects for Repository 1')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { repository: 'r1' },
        objectType: 'project',
        reset: true,
      });
    });
  });

  describe('fetching more projects', () => {
    test('fetches next page of projects', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            r1: {
              projects: [
                {
                  branch_url: 'branch-url',
                  description: 'repository description',
                  id: 'project1',
                  name: 'Project 1',
                  old_slugs: [],
                  repository: 'r1',
                  slug: 'project-1',
                },
              ],
              next: 'next-url',
              notFound: [],
              fetched: true,
            },
          },
        },
      });
      const btn = getByText('Load More');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { repository: 'r1' },
        objectType: 'project',
        url: 'next-url',
      });

      expect(getByText('Loading…')).toBeVisible();
    });

    test('hides btn when at end of list', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            r1: {
              projects: [
                {
                  branch_url: 'branch-url',
                  description: 'repository description',
                  id: 'project1',
                  name: 'Project 1',
                  old_slugs: [],
                  repository: 'r1',
                  slug: 'project-1',
                },
              ],
              next: null,
              notFound: [],
              fetched: true,
            },
          },
        },
      });

      expect(queryByText('Load More')).toBeNull();
    });
  });
});
