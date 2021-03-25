import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import ProjectDetail from '~js/components/projects/detail';
import { fetchObject, fetchObjects } from '~js/store/actions';
import { onboarded } from '~js/store/user/actions';
import { SHOW_WALKTHROUGH, WALKTHROUGH_TYPES } from '~js/utils/constants';
import routes from '~js/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('~js/store/actions');
jest.mock('~js/store/user/actions');

onboarded.mockReturnValue(() => Promise.resolve({ type: 'TEST', payload: {} }));
fetchObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObject.mockClear();
  fetchObjects.mockClear();
  onboarded.mockClear();
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
    onboarded_at: 'now',
  },
};

describe('<ProjectDetail />', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      projectSlug: 'project-1',
      location: {},
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, projectSlug, location } = opts;
    const context = {};
    const history = { replace: jest.fn() };
    const result = renderWithRedux(
      <StaticRouter context={context}>
        <ProjectDetail
          match={{ params: { projectSlug } }}
          location={location}
          history={history}
        />
      </StaticRouter>,
      initialState,
      storeWithThunk,
    );
    return {
      ...result,
      context,
      history,
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
      const { queryByText, getByText, getByTitle } = setup();
      fireEvent.click(getByText('Create an Epic'));

      expect(getByText('Create an Epic for Project 1')).toBeVisible();

      fireEvent.click(getByTitle('Cancel'));

      expect(queryByText('Create an Epic for Project 1')).toBeNull();
    });
  });

  describe('walkthrough tours', () => {
    let ENABLE_WALKTHROUGHS;

    beforeAll(() => {
      ENABLE_WALKTHROUGHS = window.GLOBALS.ENABLE_WALKTHROUGHS;
      window.GLOBALS.ENABLE_WALKTHROUGHS = true;
    });

    afterAll(() => {
      window.GLOBALS.ENABLE_WALKTHROUGHS = ENABLE_WALKTHROUGHS;
    });

    test('opens/closes landing modal', async () => {
      const { queryByText, findByText, getByTitle } = setup({
        initialState: {
          ...defaultState,
          user: {
            username: 'test-user',
            onboarded_at: null,
          },
        },
      });

      expect.assertions(3);
      const heading = await findByText('What can Metecho help you do today?', {
        exact: false,
      });

      expect(heading).toBeVisible();

      fireEvent.click(getByTitle('Close'));

      expect(
        queryByText('What can Metecho help you do today?', { exact: false }),
      ).toBeNull();
      expect(onboarded).toHaveBeenCalledTimes(1);
    });

    describe('plan tour click', () => {
      test('runs tour', async () => {
        const { queryByText, findByText, getByText, getByTitle } = setup({
          initialState: {
            ...defaultState,
            user: {
              username: 'foobar',
              onboarded_at: null,
            },
          },
        });

        expect.assertions(2);
        await findByText('What can Metecho help you do today?', {
          exact: false,
        });
        fireEvent.click(getByText('Start Plan Walkthrough'));
        const dialog = await findByText('Create Epics to group Tasks');

        expect(dialog).toBeVisible();

        fireEvent.click(getByTitle('Close'));

        expect(queryByText('Create Epics to group Tasks')).toBeNull();
      });
    });

    describe('redirect from menu dropdown', () => {
      test('runs tour', async () => {
        const { findByText, history } = setup({
          location: { state: { [SHOW_WALKTHROUGH]: WALKTHROUGH_TYPES.PLAN } },
        });

        expect.assertions(2);
        const dialog = await findByText('Create Epics to group Tasks');

        expect(dialog).toBeVisible();
        expect(history.replace).toHaveBeenCalledWith({ state: {} });
      });
    });
  });
});
