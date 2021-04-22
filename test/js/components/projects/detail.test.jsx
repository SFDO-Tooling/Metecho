import { fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import ProjectDetail from '~js/components/projects/detail';
import { createObject, fetchObject, fetchObjects } from '~js/store/actions';
import { onboarded } from '~js/store/user/actions';
import { SHOW_WALKTHROUGH, WALKTHROUGH_TYPES } from '~js/utils/constants';
import routes from '~js/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('~js/store/actions');
jest.mock('~js/store/user/actions');

onboarded.mockReturnValue(() => Promise.resolve({ type: 'TEST', payload: {} }));
fetchObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
createObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObject.mockClear();
  fetchObjects.mockClear();
  onboarded.mockClear();
  createObject.mockClear();
});

const defaultOrg = {
  id: 'org-id',
  project: 'p1',
  org_type: 'Playground',
  owner: 'my-user',
  owner_gh_username: 'currentUser',
  owner_gh_id: 'my-user-id',
  expires_at: '2019-09-16T12:58:53.721Z',
  latest_commit: '617a51',
  latest_commit_url: '/test/commit/url/',
  latest_commit_at: '2019-08-16T12:58:53.721Z',
  last_checked_unsaved_changes_at: new Date().toISOString(),
  url: '/test/org/url/',
  is_created: true,
  unsaved_changes: { Foo: ['Bar'] },
  has_unsaved_changes: true,
  total_unsaved_changes: 1,
  ignored_changes: {},
  has_ignored_changes: false,
  total_ignored_changes: 0,
  valid_target_directories: {
    source: ['src'],
    post: ['foo/bar', 'buz/baz'],
  },
  has_been_visited: true,
};

const defaultState = {
  projects: {
    projects: [
      {
        id: 'p1',
        name: 'Project 1',
        slug: 'project-1',
        old_slugs: ['old-slug'],
        description: 'This is a test project.',
        description_rendered: '<p>This is a test project.</p>',
        repo_url: 'https://github.com/test/test-repo',
        github_users: [],
        repo_image_url: 'https://github.com/repo-image',
        org_config_names: [{ key: 'dev' }, { key: 'qa' }],
        has_push_permission: true,
      },
    ],
    notFound: ['yet-another-project'],
    next: null,
  },
  epics: {
    p1: {
      epics: [
        {
          id: 'epic1',
          slug: 'epic-1',
          name: 'Epic 1',
          project: 'p1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: [],
          status: 'In progress',
        },
        {
          id: 'epic2',
          slug: 'epic-2',
          name: 'Epic 2',
          project: 'p1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: [],
          status: 'Planned',
        },
        {
          id: 'epic3',
          slug: 'epic-3',
          name: 'Epic 3',
          project: 'p1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: [],
          status: 'Merged',
        },
        {
          id: 'epic4',
          slug: 'epic-4',
          name: 'Epic 4',
          project: 'p1',
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
  orgs: {
    orgs: {
      [defaultOrg.id]: defaultOrg,
    },
    fetched: {
      projects: ['p1'],
      epics: [],
      tasks: [],
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

  test('renders readonly project detail', () => {
    const { getByText } = setup({
      initialState: {
        ...defaultState,
        projects: {
          ...defaultState.projects,
          projects: [
            {
              ...defaultState.projects.projects[0],
              has_push_permission: false,
            },
          ],
        },
        epics: {
          p1: {
            epics: [],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
      },
    });

    expect(getByText('Epics for Project 1')).toBeVisible();
    expect(
      getByText('There are no Epics for this Project.', { exact: false }),
    ).toBeVisible();
  });

  test('renders different title if no epics', () => {
    const { getByText, queryByText } = setup({
      initialState: {
        ...defaultState,
        epics: {
          p1: {
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

  describe('orgs have not been fetched', () => {
    test('fetches orgs from API', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          orgs: {
            orgs: {},
            fetched: {
              projects: [],
              epics: [],
              tasks: [],
            },
          },
        },
      });

      expect(queryByText('Project Scratch Org')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { project: 'p1' },
        objectType: 'scratch_org',
      });
    });
  });

  describe('epics have not been fetched', () => {
    test('fetches epics from API', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          epics: {
            p1: {
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
        filters: { project: 'p1' },
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
            p1: {
              epics: [
                {
                  branch_url: 'branch-url',
                  description: 'project description',
                  description_rendered: '<p>project description</p>',
                  id: 'epic1',
                  name: 'Epic 1',
                  old_slugs: [],
                  project: 'p1',
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
        filters: { project: 'p1' },
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
            p1: {
              epics: [
                {
                  branch_url: 'branch-url',
                  description: 'project description',
                  description_rendered: '<p>project description</p>',
                  id: 'epic1',
                  name: 'Epic 1',
                  old_slugs: [],
                  project: 'p1',
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

  describe('<CreateOrgModal />', () => {
    let result;

    beforeEach(() => {
      result = setup({
        initialState: {
          ...defaultState,
          orgs: {
            orgs: {},
            fetched: {
              projects: ['p1'],
              epics: [],
              tasks: [],
            },
          },
        },
      });
      fireEvent.click(result.getByText('Create Scratch Org'));
    });

    describe('"cancel" click', () => {
      test('closes modal', () => {
        const { getByText, queryByText } = result;

        expect(
          getByText('You are creating a Scratch Org', { exact: false }),
        ).toBeVisible();

        fireEvent.click(getByText('Cancel'));

        expect(
          queryByText('You are creating a Scratch Org', { exact: false }),
        ).toBeNull();
      });
    });

    describe('"Create Org" click', () => {
      test('creates scratch org', async () => {
        const { getByText, getByLabelText, queryByText } = result;

        expect.assertions(5);
        fireEvent.click(getByText('Next'));

        expect(getByText('Advanced Options')).toBeVisible();

        fireEvent.click(getByText('Advanced Options'));
        fireEvent.click(getByLabelText('qa'));
        fireEvent.click(getByText('Create Org'));
        await waitForElementToBeRemoved(getByText('Advanced Options'));

        expect(queryByText('Advanced Options')).toBeNull();
        expect(createObject).toHaveBeenCalled();
        expect(createObject.mock.calls[0][0].data.project).toEqual('p1');
        expect(createObject.mock.calls[0][0].data.org_config_name).toEqual(
          'qa',
        );
      });
    });
  });
});
