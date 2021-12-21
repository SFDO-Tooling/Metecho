import {
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import ProjectDetail from '@/js/components/projects/detail';
import { createObject, fetchObject, fetchObjects } from '@/js/store/actions';
import { refreshGitHubIssues } from '@/js/store/projects/actions';
import { onboarded } from '@/js/store/user/actions';
import { SHOW_WALKTHROUGH, WALKTHROUGH_TYPES } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

import {
  sampleEpic1,
  sampleEpic2,
  sampleIssue1,
  sampleIssue2,
  sampleIssue3,
  sampleIssue4,
  sampleProject1,
} from '../../../../src/stories/fixtures';
import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/js/store/actions');
jest.mock('@/js/store/user/actions');
jest.mock('@/js/store/projects/actions');

onboarded.mockReturnValue(() => Promise.resolve({ type: 'TEST', payload: {} }));
fetchObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
createObject.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
refreshGitHubIssues.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchObject.mockClear();
  fetchObjects.mockClear();
  onboarded.mockClear();
  createObject.mockClear();
  refreshGitHubIssues.mockClear();
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
        github_users: sampleProject1.github_users,
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
          github_users: sampleEpic1.github_users,
          status: 'In progress',
        },
        {
          id: 'epic2',
          slug: 'epic-2',
          name: 'Epic 2',
          project: 'p1',
          description: 'Epic Description',
          description_rendered: '<p>Epic Description</p>',
          github_users: sampleEpic2.github_users,
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
  tasks: {},
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

const tasks = [
  {
    id: 'task1',
    name: 'Task 1',
    slug: 'task-1',
    old_slugs: ['old-slug'],
    epic: {
      id: 'epic1',
      name: 'Epic 1',
      slug: 'epic-1',
      github_users: [],
    },
    project: null,
    root_project: 'p1',
    branch_url: 'https://github.com/test/test-repo/tree/feature/epic-1__task-1',
    branch_name: 'feature/epic-1__task-1',
    description: 'Task Description',
    description_rendered: '<p>Task Description</p>',
    has_unmerged_commits: false,
    commits: [],
    assigned_dev: 'my-user',
    assigned_qa: null,
  },
  {
    id: 'task2',
    name: 'Task 2',
    slug: 'task-2',
    old_slugs: ['old-slug'],
    epic: {
      id: 'epic2',
      name: 'Epic 2',
      slug: 'epic-2',
      github_users: [],
    },
    project: null,
    root_project: 'p1',
    branch_url: 'https://github.com/test/test-repo/tree/feature/epic-2__task-2',
    branch_name: 'feature/epic-2__task-2',
    description: 'Task Description',
    description_rendered: '<p>Task Description</p>',
    has_unmerged_commits: false,
    commits: [],
    assigned_dev: null,
    assigned_qa: 'my-user',
  },
  {
    id: 'task3',
    name: 'Task 3',
    slug: 'task-3',
    old_slugs: [],
    epic: null,
    project: 'p1',
    root_project: 'p1',
    branch_url: 'https://github.com/test/test-repo/tree/feature/task-3',
    branch_name: 'feature/task-3',
    description: 'Task Description',
    description_rendered: '<p>Task Description</p>',
    has_unmerged_commits: false,
    commits: [],
    assigned_dev: null,
    assigned_qa: null,
  },
];

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
  });

  test('renders empty epics list', () => {
    const { getByText, getAllByTitle } = setup({
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

    expect(getAllByTitle('Project 1')[0]).toBeVisible();
    expect(getByText('This is a test project.')).toBeVisible();
    expect(
      getByText('You can create a new Epic', { exact: false }),
    ).toBeVisible();
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

    expect(
      getByText('There are no Epics for this Project.', { exact: false }),
    ).toBeVisible();
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
      expect(getByText('list of all Projects')).toBeVisible();
    });
  });

  describe('old project slug', () => {
    test('redirects to project_detail with new slug', () => {
      const { context } = setup({ projectSlug: 'old-slug' });

      expect(context.action).toBe('REPLACE');
      expect(context.url).toEqual(routes.project_detail('project-1'));
    });
  });

  describe('no project slug', () => {
    test('renders <ProjectNotFound />', () => {
      const { getByText, queryByText } = setup({ projectSlug: '' });

      expect(queryByText('Project 1')).toBeNull();
      expect(getByText('list of all Projects')).toBeVisible();
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
      setup({
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

  describe('Tasks tab', () => {
    test('fetches tasks list', () => {
      const { getAllByText } = setup();
      fireEvent.click(getAllByText('Tasks')[0]);

      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { project: 'p1' },
        objectType: 'task',
      });
    });

    test('renders tasks list', async () => {
      const { getAllByText, findByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            p1: {
              fetched: true,
              notFound: [],
              tasks,
            },
          },
        },
      });

      expect.assertions(1);
      fireEvent.click(getAllByText('Tasks')[0]);
      const task = await findByText('Task 2');

      expect(task).toBeVisible();
    });

    test('renders empty tasks list', async () => {
      const { getAllByText, findByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            p1: {
              fetched: true,
              notFound: [],
              tasks: [],
            },
          },
        },
      });

      expect.assertions(1);
      fireEvent.click(getAllByText('Tasks')[0]);
      const msg = await findByText('There are no Tasks for this Project.', {
        exact: false,
      });

      expect(msg).toBeVisible();
    });

    describe('<CreateTaskModal />', () => {
      test('opens/closes form', async () => {
        expect.assertions(2);
        const { queryByText, findByText, getByText, getAllByText, getByTitle } =
          setup({
            initialState: {
              ...defaultState,
              tasks: {
                p1: {
                  fetched: true,
                  notFound: [],
                  tasks: [],
                },
              },
            },
          });
        fireEvent.click(getAllByText('Tasks')[0]);
        fireEvent.click(await findByText('Create a Task'));

        expect(getByText('Create a Task for Project 1')).toBeVisible();

        fireEvent.click(getByTitle('Cancel'));

        expect(queryByText('Create a Task for Project 1')).toBeNull();
      });
    });
  });

  describe('<SelectIssueModal />', () => {
    test('opens/closes modal', () => {
      fetchMock.get(`begin:${window.api_urls.issue_list()}`, {
        results: [],
      });
      const { queryByText, getByText, getByTitle } = setup();
      fireEvent.click(getByText('Create Epic from GitHub Issue'));

      expect(getByText('Select GitHub Issue to Develop')).toBeVisible();

      fireEvent.click(getByTitle('Cancel'));

      expect(queryByText('Select GitHub Issue to Develop')).toBeNull();
    });

    test('creates a task from issue', async () => {
      fetchMock.getOnce('end:is_attached=false', {
        results: [sampleIssue1],
      });
      fetchMock.getOnce('end:is_attached=true', {
        results: [sampleIssue2],
      });
      const {
        queryByText,
        getByText,
        findByLabelText,
        getAllByText,
        findByText,
      } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            p1: {
              fetched: true,
              notFound: [],
              tasks: [],
            },
          },
        },
      });
      expect.assertions(3);
      fireEvent.click(getAllByText('Tasks')[0]);

      const btn = await findByText('Create Task from GitHub Issue');
      fireEvent.click(btn);

      expect(getByText('Select GitHub Issue to Develop')).toBeVisible();

      const radio = await findByLabelText('#87: this is an issue');
      fireEvent.click(radio);
      fireEvent.click(getAllByText('Create a Task')[1]);

      expect(queryByText('Select GitHub Issue to Develop')).toBeNull();

      await findByText('Attached Issue:');

      expect(getByText('#87: this is an issue')).toBeVisible();
    });

    test('creates an epic from issue', async () => {
      fetchMock.get('end:is_attached=false', {
        results: [sampleIssue1],
      });
      fetchMock.get('end:is_attached=true', {
        results: [sampleIssue2, sampleIssue3, sampleIssue4],
      });
      const {
        queryByText,
        getByText,
        findByLabelText,
        getAllByText,
        findByText,
      } = setup();
      fireEvent.click(getByText('Create Epic from GitHub Issue'));

      expect.assertions(3);
      expect(getByText('Select GitHub Issue to Develop')).toBeVisible();

      const radio = await findByLabelText('#87: this is an issue');
      fireEvent.click(radio);
      fireEvent.click(getAllByText('Create an Epic')[1]);

      expect(queryByText('Select GitHub Issue to Develop')).toBeNull();

      await findByText('Attached Issue:');

      expect(getByText('#87: this is an issue')).toBeVisible();
    });

    test('refreshes issues', async () => {
      fetchMock.get('end:is_attached=true', {
        results: [sampleIssue1],
      });
      fetchMock.get('end:is_attached=false', {
        results: [sampleIssue2, sampleIssue3, sampleIssue4],
      });
      fetchMock.postOnce(
        window.api_urls.project_refresh_github_issues(sampleIssue1.project),
        202,
      );
      const { getByText } = setup();
      fireEvent.click(getByText('Create Epic from GitHub Issue'));

      expect.assertions(2);
      expect(getByText('Select GitHub Issue to Develop')).toBeVisible();

      const btn = await getByText('Re-Sync Issues');
      fireEvent.click(btn);

      expect(refreshGitHubIssues).toHaveBeenCalledTimes(1);
    });

    test('displays loading btn while refreshing', () => {
      fetchMock.get('end:is_attached=true', {
        results: [sampleIssue1],
      });
      fetchMock.get('end:is_attached=false', {
        results: [sampleIssue2, sampleIssue3, sampleIssue4],
      });
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          projects: {
            ...defaultState.projects,
            projects: [
              {
                ...defaultState.projects.projects[0],
                currently_fetching_issues: true,
              },
            ],
          },
        },
      });
      fireEvent.click(getByText('Create Epic from GitHub Issue'));

      expect(getByText('Syncing GitHub Issues…')).toBeVisible();
    });

    test('refreshes issues by retrieving them from github when none locally', async () => {
      fetchMock.get('end:is_attached=true', {
        results: [],
      });
      fetchMock.get('end:is_attached=false', {
        results: [],
      });
      const { getByText } = setup();
      fireEvent.click(getByText('Create Epic from GitHub Issue'));

      expect(getByText('Select GitHub Issue to Develop')).toBeVisible();
      await waitFor(() => expect(refreshGitHubIssues).toHaveBeenCalledTimes(1));
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

    describe('play tour click', () => {
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
        fireEvent.click(getByText('Start Play Walkthrough'));
        const dialog = await findByText('View & play with a Project');

        expect(dialog).toBeVisible();

        fireEvent.click(getByTitle('Close'));

        expect(queryByText('View & play with a Project')).toBeNull();
      });
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
        const dialog = await findByText('List of Tasks');

        expect(dialog).toBeVisible();

        fireEvent.click(getByTitle('Close'));

        expect(queryByText('List of Tasks')).toBeNull();
      });
    });

    describe('help tour click', () => {
      test('runs tour with task tab active', async () => {
        const { queryByText, findByText, getByText, getByTitle } = setup({
          initialState: {
            ...defaultState,
            user: {
              username: 'foobar',
              onboarded_at: null,
            },
          },
        });

        expect.assertions(3);
        await findByText('What can Metecho help you do today?', {
          exact: false,
        });
        fireEvent.click(getByText('Start Help Walkthrough'));
        const dialog = await findByText('List of Tasks');

        expect(dialog).toBeVisible();

        const btn = await findByText('Create a Task');

        expect(btn).toBeVisible();

        fireEvent.click(getByTitle('Close'));

        expect(queryByText('List of Tasks')).toBeNull();
      });
    });

    describe('redirect from menu dropdown', () => {
      test('runs tour', async () => {
        const { findByText, history } = setup({
          location: { state: { [SHOW_WALKTHROUGH]: WALKTHROUGH_TYPES.PLAN } },
        });

        expect.assertions(2);
        const dialog = await findByText('List of Tasks');

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
          projects: {
            ...defaultState.projects,
            projects: [
              {
                ...defaultState.projects.projects[0],
                has_push_permission: false,
              },
            ],
          },
        },
      });
      fireEvent.click(result.getByText('Create Scratch Org'));
    });

    describe('"cancel" click', () => {
      test('closes modal', () => {
        const { getByText, queryByText, getByTitle } = result;

        expect(
          getByText('You are creating a Scratch Org', { exact: false }),
        ).toBeVisible();

        fireEvent.click(getByTitle('Cancel'));

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
        expect(createObject.mock.calls[0][0].data.project).toBe('p1');
        expect(createObject.mock.calls[0][0].data.org_config_name).toBe('qa');
      });
    });
  });

  describe('<ContributeWorkModal />', () => {
    describe('"cancel" click', () => {
      test('closes modal', () => {
        const { getByText, queryByText, getByLabelText, getByTitle } = setup();
        fireEvent.click(getByText('Contribute Work'));

        expect(getByText('Contribute Work from Scratch Org')).toBeVisible();

        fireEvent.click(getByLabelText('Create a new Task with no Epic'));
        fireEvent.click(getByLabelText('Create a new Epic and Task'));
        fireEvent.click(getByTitle('Cancel'));

        expect(queryByText('Contribute Work from Scratch Org')).toBeNull();
      });
    });

    describe('"Contribute" click with Epic', () => {
      test('opens Create Epic modal', () => {
        const { getByText } = setup();
        fireEvent.click(getByText('Contribute Work'));
        fireEvent.click(getByText('Contribute'));

        expect(
          getByText('Create an Epic to Contribute Work from Scratch Org'),
        ).toBeVisible();
      });
    });

    describe('"Contribute" click without Epic', () => {
      test('opens Create Task modal', () => {
        const { getByText, getByLabelText } = setup();
        fireEvent.click(getByText('Contribute Work'));
        fireEvent.click(getByLabelText('Create a new Task with no Epic'));
        fireEvent.click(getByText('Contribute'));

        expect(
          getByText('Create a Task to Contribute Work from Scratch Org'),
        ).toBeVisible();
      });
    });

    describe('User does not have permissions', () => {
      test('does not allow contributing', () => {
        const projects = {
          ...defaultState.projects,
          projects: [
            {
              ...defaultState.projects.projects[0],
              has_push_permission: false,
            },
          ],
        };
        const { getByText } = setup({
          initialState: {
            ...defaultState,
            projects,
          },
        });
        fireEvent.click(getByText('Contribute Work'));

        expect(getByText('Contribute Work from Scratch Org')).toBeVisible();
        expect(
          getByText('You do not have “push” access', { exact: false }),
        ).toBeVisible();
      });
    });
  });
});
