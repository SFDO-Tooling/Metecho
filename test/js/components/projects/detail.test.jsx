import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import ProjectDetail from '~js/components/projects/detail';
import { fetchObject, fetchObjects } from '~js/store/actions';
import routes from '~js/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('~js/store/actions');

fetchObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObject.mockClear();
  fetchObjects.mockClear();
});

const defaultState = {
  projects: {
    projects: [
      {
        id: 'r1',
        name: 'Project 1',
        slug: 'project-1',
        old_slugs: ['old-slug'],
        description: 'This is a test project.',
        description_rendered: '<p>This is a test project.</p>',
        repo_url: 'https://github.com/test/test-repo',
        github_users: [],
        repo_image_url: 'https://github.com/repo-image',
      },
    ],
    notFound: ['yet-another-project'],
    next: null,
  },
  epics: {
    r1: {
      epics: [
        {
          id: 'epic1',
          slug: 'epic-1',
          name: 'Epic 1',
          project: 'r1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: [],
          status: 'In progress',
        },
        {
          id: 'epic2',
          slug: 'epic-2',
          name: 'Epic 2',
          project: 'r1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: [],
          status: 'Planned',
        },
        {
          id: 'epic3',
          slug: 'epic-3',
          name: 'Epic 3',
          project: 'r1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: [],
          status: 'Merged',
        },
        {
          id: 'epic4',
          slug: 'epic-4',
          name: 'Epic 4',
          project: 'r1',
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

describe('<ProjectDetail />', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      projectSlug: 'project-1',
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, projectSlug } = opts;
    const context = {};
    const result = renderWithRedux(
      <StaticRouter context={context}>
        <ProjectDetail match={{ params: { projectSlug } }} />
      </StaticRouter>,
      initialState,
      storeWithThunk,
    );
    return {
      ...result,
      context,
    };
  };

  test('renders project detail and epics list', () => {
    const { getByText, getAllByTitle } = setup();

    expect(getAllByTitle('Project 1')[0]).toBeVisible();
    expect(getByText('This is a test project.')).toBeVisible();
    expect(getByText('Epic 1')).toBeVisible();
    expect(getByText('Epics for Project 1')).toBeVisible();
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

    expect(getByText('Create an Epic for Project 1')).toBeVisible();
    expect(queryByText('Epics for Project 1')).toBeNull();
  });

  describe('project not found', () => {
    test('fetches project from API', () => {
      const { queryByText } = setup({ projectSlug: 'other-project' });

      expect(queryByText('Project 1')).toBeNull();
      expect(fetchObject).toHaveBeenCalledWith({
        filters: { slug: 'other-project' },
        objectType: 'project',
      });
    });
  });

  describe('project does not exist', () => {
    test('renders <ProjectNotFound />', () => {
      const { getByText, queryByText } = setup({
        projectSlug: 'yet-another-project',
      });

      expect(queryByText('Project 1')).toBeNull();
      expect(getByText('list of all projects')).toBeVisible();
    });
  });

  describe('old project slug', () => {
    test('redirects to project_detail with new slug', () => {
      const { context } = setup({ projectSlug: 'old-slug' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(routes.project_detail('project-1'));
    });
  });

  describe('no project slug', () => {
    test('renders <ProjectNotFound />', () => {
      const { getByText, queryByText } = setup({ projectSlug: '' });

      expect(queryByText('Project 1')).toBeNull();
      expect(getByText('list of all projects')).toBeVisible();
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

      expect(queryByText('Epics for Project 1')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { project: 'r1' },
        objectType: 'epic',
        reset: true,
      });
    });
  });

  describe('fetching more epics', () => {
    test('fetches next page of epics', async () => {
      const { findByText, getByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            r1: {
              epics: [
                {
                  branch_url: 'branch-url',
                  description: 'project description',
                  description_rendered: '<p>project description</p>',
                  id: 'epic1',
                  name: 'Epic 1',
                  old_slugs: [],
                  project: 'r1',
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

      expect.assertions(2);
      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { project: 'r1' },
        objectType: 'epic',
        url: 'next-url',
      });

      await findByText('Loading…');
      await findByText('Load More');
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
                  description: 'project description',
                  description_rendered: '<p>project description</p>',
                  id: 'epic1',
                  name: 'Epic 1',
                  old_slugs: [],
                  project: 'r1',
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

      expect(getByText('Create an Epic for Project 1')).toBeVisible();

      fireEvent.click(queryByText('Cancel epic creation'));

      expect(queryByText('Create an Epic for Project 1')).toBeNull();
    });
  });

  describe('<TourLandingModal />', () => {
    test('opens/closes form', () => {
      const { queryByText, getByText, debug } = setup();
      debug();
      expect(
        getByText("Click on a box below to discover what's possible."),
      ).toBeVisible();

      fireEvent.click(queryByText('Close'));

      expect(
        queryByText("Click on a box below to discover what's possible."),
      ).toBeNull();
    });
  });
});
