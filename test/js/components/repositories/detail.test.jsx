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
        description_rendered: '<p>This is a test repository.</p>',
        repo_url: 'https://github.com/test/test-repo',
        github_users: [],
        repo_image_url: 'https://github.com/repo-image',
      },
    ],
    notFound: ['yet-another-repository'],
    next: null,
  },
  epics: {
    r1: {
      epics: [
        {
          id: 'epic1',
          slug: 'epic-1',
          name: 'Epic 1',
          repository: 'r1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: [],
          status: 'In progress',
        },
        {
          id: 'epic2',
          slug: 'epic-2',
          name: 'Epic 2',
          repository: 'r1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: [],
          status: 'Planned',
        },
        {
          id: 'epic3',
          slug: 'epic-3',
          name: 'Epic 3',
          repository: 'r1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: [],
          status: 'Merged',
        },
        {
          id: 'epic4',
          slug: 'epic-4',
          name: 'Epic 4',
          repository: 'r1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: [],
          status: 'Review',
        },
      ],
      next: 'next-url',
      notFound: [],
      fetched: true,
    },
  },
  user: {
    username: 'my-user',
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
    const result = renderWithRedux(
      <StaticRouter context={context}>
        <RepoDetail match={{ params: { repositorySlug } }} />
      </StaticRouter>,
      initialState,
      storeWithThunk,
    );
    return {
      ...result,
      context,
    };
  };

  test('renders repository detail and epics list', () => {
    const { getByText, getAllByTitle } = setup();

    expect(getAllByTitle('Repository 1')[0]).toBeVisible();
    expect(getByText('This is a test repository.')).toBeVisible();
    expect(getByText('Epic 1')).toBeVisible();
    expect(getByText('Epics for Repository 1')).toBeVisible();
  });

  test('renders with form expanded if no epics', () => {
    const { getByText, queryByText } = setup({
      initialState: {
        ...defaultState,
        epics: {
          r1: {
            epics: [],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
      },
    });

    expect(getByText('Create an Epic for Repository 1')).toBeVisible();
    expect(queryByText('Epics for Repository 1')).toBeNull();
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

  describe('epics have not been fetched', () => {
    test('fetches epics from API', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            r1: {
              epics: [],
              next: null,
              notFound: [],
              fetched: false,
            },
          },
        },
      });

      expect(queryByText('Epics for Repository 1')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { repository: 'r1' },
        objectType: 'epic',
        reset: true,
      });
    });
  });

  describe('fetching more epics', () => {
    test('fetches next page of epics', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            r1: {
              epics: [
                {
                  branch_url: 'branch-url',
                  description: 'repository description',
                  description_rendered: '<p>repository description</p>',
                  id: 'epic1',
                  name: 'Epic 1',
                  old_slugs: [],
                  repository: 'r1',
                  slug: 'epic-1',
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
        objectType: 'epic',
        url: 'next-url',
      });

      expect(getByText('Loading…')).toBeVisible();
    });

    test('hides btn when at end of list', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            r1: {
              epics: [
                {
                  branch_url: 'branch-url',
                  description: 'repository description',
                  description_rendered: '<p>repository description</p>',
                  id: 'epic1',
                  name: 'Epic 1',
                  old_slugs: [],
                  repository: 'r1',
                  slug: 'epic-1',
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

  describe('<CreateEpicModal />', () => {
    test('opens/closes form', () => {
      const { queryByText, getByText } = setup();
      fireEvent.click(getByText('Create an Epic'));

      expect(getByText('Create an Epic for Repository 1')).toBeVisible();

      fireEvent.click(queryByText('Close'));

      expect(queryByText('Create an Epic for Repository 1')).toBeNull();
    });
  });
});
