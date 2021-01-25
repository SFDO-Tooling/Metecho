import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import TaskDetail from '~js/components/tasks/detail';
import { createObject, fetchObjects } from '~js/store/actions';
import { refetchOrg, refreshOrg } from '~js/store/orgs/actions';
import { TASK_STATUSES } from '~js/utils/constants';
import routes from '~js/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('~js/store/actions');
jest.mock('~js/store/orgs/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
fetchObjects.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
refetchOrg.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
refreshOrg.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  createObject.mockClear();
  fetchObjects.mockClear();
  refetchOrg.mockClear();
  refreshOrg.mockClear();
});

const defaultState = {
  user: {
    id: 'user-id',
    username: 'user-name',
    valid_token_for: 'my-org',
    is_devhub_enabled: true,
  },
  projects: {
    projects: [
      {
        id: 'r1',
        name: 'Project 1',
        slug: 'project-1',
        old_slugs: [],
        description: 'This is a test project.',
        description_rendered: '<p>This is a test project.</p>',
        repo_url: 'https://github.com/test/test-repo',
        repo_owner: 'test',
        repo_name: 'test-repo',
        github_users: [
          {
            id: 'user-1',
            login: 'user-name',
          },
        ],
      },
    ],
    notFound: ['different-project'],
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
          branch_url: 'https://github.com/test/test-repo/tree/branch-name',
          branch_name: 'branch-name',
          old_slugs: [],
          github_users: [
            {
              id: 'user-1',
              login: 'user-name',
            },
          ],
        },
      ],
      next: null,
      notFound: ['different-epic'],
      fetched: true,
    },
  },
  tasks: {
    epic1: [
      {
        id: 'task1',
        name: 'Task 1',
        slug: 'task-1',
        old_slugs: ['old-slug'],
        epic: 'epic1',
        branch_url: 'https://github.com/test/test-repo/tree/epic__task',
        branch_name: 'epic__task',
        description: 'Task Description',
        description_rendered: '<p>Task Description</p>',
        has_unmerged_commits: false,
        commits: [],
        assigned_dev: {
          login: 'user-name',
        },
        assigned_qa: null,
      },
    ],
  },
  orgs: {
    task1: {
      Dev: {
        id: 'org-id',
        task: 'task1',
        org_type: 'Dev',
        owner: 'user-id',
        owner_gh_username: 'user-name',
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
      },
      QA: null,
    },
  },
};

describe('<TaskDetail/>', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      projectSlug: 'project-1',
      epicSlug: 'epic-1',
      taskSlug: 'task-1',
      rerender: false,
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, projectSlug, epicSlug, taskSlug } = opts;
    const context = {};
    const result = renderWithRedux(
      <StaticRouter context={context}>
        <TaskDetail match={{ params: { projectSlug, epicSlug, taskSlug } }} />
      </StaticRouter>,
      initialState,
      storeWithThunk,
      opts.rerender,
      opts.store,
    );
    return { ...result, context };
  };

  test('renders task detail with org', () => {
    const { getByText, getByTitle, queryByText } = setup();

    expect(getByTitle('Task 1')).toBeVisible();
    expect(getByText('Task Description')).toBeVisible();
    expect(queryByText('View Branch')).toBeVisible();
    expect(getByTitle('View Org')).toBeVisible();
    expect(getByText('Task Team & Orgs')).toBeVisible();
  });

  test('renders view changes if has_unmerged_commits, branch_diff_url', () => {
    const { getByText, getByTitle } = setup({
      initialState: {
        ...defaultState,
        tasks: {
          ...defaultState.tasks,
          epic1: [
            {
              ...defaultState.tasks.epic1[0],
              branch_diff_url: 'https://github.com/example/repo',
              has_unmerged_commits: true,
            },
          ],
        },
      },
    });

    expect(getByTitle('Task 1')).toBeVisible();
    expect(getByText('View Changes')).toBeVisible();
  });

  test('renders view pr button if pr_url exists', () => {
    const { getByText, getByTitle } = setup({
      initialState: {
        ...defaultState,
        tasks: {
          ...defaultState.tasks,
          epic1: [
            {
              ...defaultState.tasks.epic1[0],
              pr_url: 'my-pr-url',
            },
          ],
        },
      },
    });

    expect(getByTitle('Task 1')).toBeVisible();
    expect(getByText('View Pull Request')).toBeVisible();
  });

  describe('tasks not found', () => {
    test('fetches tasks from API', () => {
      const { queryByText } = setup({
        initialState: { ...defaultState, tasks: {} },
      });

      expect(queryByText('Task 1')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledWith({
        filters: { epic: 'epic1' },
        objectType: 'task',
      });
    });
  });

  describe('project does not exist', () => {
    test('renders <ProjectNotFound />', () => {
      const { getByText, queryByText } = setup({
        projectSlug: 'different-project',
      });

      expect(queryByText('Task 1')).toBeNull();
      expect(getByText('list of all projects')).toBeVisible();
    });
  });

  describe('epic does not exist', () => {
    test('renders <EpicNotFound />', () => {
      const { getByText, queryByText } = setup({
        epicSlug: 'different-epic',
      });

      expect(queryByText('Task 1')).toBeNull();
      expect(getByText('another epic')).toBeVisible();
    });
  });

  describe('task does not exist', () => {
    test('renders <TaskNotFound />', () => {
      const { getByText, queryByText } = setup({
        taskSlug: 'different-task',
      });

      expect(queryByText('Task 1')).toBeNull();
      expect(getByText('another task')).toBeVisible();
    });
  });

  describe('old task slug', () => {
    test('redirects to task_detail with new slug', () => {
      const { context } = setup({ taskSlug: 'old-slug' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(
        routes.task_detail('project-1', 'epic-1', 'task-1'),
      );
    });
  });

  describe('orgs have not been fetched', () => {
    test('fetches orgs from API', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          orgs: {},
        },
      });

      expect(queryByText('Task Team & Orgs')).toBeNull();
      expect(fetchObjects).toHaveBeenCalledTimes(1);
      expect(fetchObjects).toHaveBeenCalledWith({
        objectType: 'scratch_org',
        filters: { task: 'task1' },
      });
    });
  });

  describe('"Retrieve Changes from Dev Org" click', () => {
    test('refreshes and then opens modal', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Retrieve Changes from Dev Org'));

      expect(refetchOrg).toHaveBeenCalledTimes(1);

      const refetchArgs = refetchOrg.mock.calls[0][0];

      expect(refetchArgs.id).toEqual('org-id');

      expect(
        getByText('Select the location to retrieve changes'),
      ).toBeVisible();
    });

    describe('org has been checked within past 5 minutes', () => {
      let ORG_RECHECK_MINUTES;

      beforeAll(() => {
        ORG_RECHECK_MINUTES = window.GLOBALS.ORG_RECHECK_MINUTES;
        window.GLOBALS.ORG_RECHECK_MINUTES = 5;
      });

      afterAll(() => {
        window.GLOBALS.ORG_RECHECK_MINUTES = ORG_RECHECK_MINUTES;
      });

      test('just opens modal', () => {
        const { getByText, queryByText } = setup();
        fireEvent.click(getByText('Retrieve Changes from Dev Org'));

        expect(refetchOrg).not.toHaveBeenCalled();
        expect(
          getByText('Select the location to retrieve changes'),
        ).toBeVisible();

        fireEvent.click(getByText('Close'));

        expect(
          queryByText('Select the location to retrieve changes'),
        ).toBeNull();
      });
    });
  });

  describe('retrieving changes', () => {
    test('renders loading button', () => {
      const { getAllByText } = setup({
        initialState: {
          ...defaultState,
          orgs: {
            ...defaultState.orgs,
            task1: {
              ...defaultState.orgs.task1,
              Dev: {
                ...defaultState.orgs.task1.Dev,
                currently_capturing_changes: true,
              },
            },
          },
        },
      });

      expect(getAllByText('Retrieving Selected Changes…')).toHaveLength(2);
    });
  });

  describe('reassigning org', () => {
    test('renders loading button', () => {
      const { getAllByText } = setup({
        initialState: {
          ...defaultState,
          orgs: {
            ...defaultState.orgs,
            task1: {
              ...defaultState.orgs.task1,
              Dev: {
                ...defaultState.orgs.task1.Dev,
                currently_reassigning_user: true,
              },
            },
          },
        },
      });

      expect(getAllByText('Reassigning Org Ownership…')).toHaveLength(2);
    });
  });

  describe('pr is closed', () => {
    test('renders "Submit Task for Testing" button', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            ...defaultState.tasks,
            epic1: [
              {
                ...defaultState.tasks.epic1[0],
                has_unmerged_commits: true,
                pr_url: 'my-pr-url',
                pr_is_open: false,
              },
            ],
          },
        },
      });

      expect(getByText('Submit Task for Testing')).toBeVisible();
    });
  });

  describe('pr is open', () => {
    test('does not render "Submit Task for Testing" button', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            ...defaultState.tasks,
            epic1: [
              {
                ...defaultState.tasks.epic1[0],
                has_unmerged_commits: true,
                pr_url: 'my-pr-url',
                pr_is_open: true,
                review_valid: true,
              },
            ],
          },
        },
      });

      expect(queryByText('Submit Task for Testing')).toBeNull();
    });
  });

  describe('"Submit Task for Testing" click', () => {
    test('opens modal', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            ...defaultState.tasks,
            epic1: [
              {
                ...defaultState.tasks.epic1[0],
                has_unmerged_commits: true,
              },
            ],
          },
        },
      });
      fireEvent.click(getByText('Submit Task for Testing'));

      expect(getByText('Submit this task for testing')).toBeVisible();
    });
  });

  describe('submitting task for testing', () => {
    test('renders loading button', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          tasks: {
            ...defaultState.tasks,
            epic1: [
              {
                ...defaultState.tasks.epic1[0],
                has_unmerged_commits: true,
                currently_creating_pr: true,
              },
            ],
          },
        },
      });

      expect(getByText('Submitting Task for Testing…')).toBeVisible();
    });
  });

  test('renders loading button in primary position', () => {
    const { getByText } = setup({
      initialState: {
        ...defaultState,
        tasks: {
          ...defaultState.tasks,
          epic1: [
            {
              ...defaultState.tasks.epic1[0],
              has_unmerged_commits: true,
              currently_creating_pr: true,
            },
          ],
        },
        orgs: {
          ...defaultState.orgs,
          task1: {
            ...defaultState.orgs.task1,
            Dev: {
              ...defaultState.orgs.task1.Dev,
              total_unsaved_changes: 0,
            },
          },
        },
      },
    });

    expect(getByText('Submitting Task for Testing…')).toBeVisible();
  });

  describe('edit task click', () => {
    test('opens and closes modal', () => {
      const { getByText, queryByText } = setup();
      fireEvent.click(getByText('Task Options'));
      fireEvent.click(getByText('Edit Task'));

      expect(getByText('Edit Task')).toBeVisible();

      fireEvent.click(getByText('Cancel'));

      expect(queryByText('Edit Task')).toBeNull();
    });
  });

  test('opens/closed deleted modal', () => {
    const { getByText, queryByText } = setup();
    fireEvent.click(getByText('Task Options'));
    fireEvent.click(getByText('Delete Task'));

    expect(getByText('Confirm Deleting Task')).toBeVisible();

    fireEvent.click(getByText('Cancel'));

    expect(queryByText('Confirm Deleting Task')).toBeNull();
  });

  describe('submitting a review', () => {
    const tasks = {
      ...defaultState.tasks,
      epic1: [
        {
          ...defaultState.tasks.epic1[0],
          pr_is_open: true,
          assigned_qa: { id: 'user-id', login: 'user-name' },
          commits: [],
          origin_sha: 'parent',
          review_submitted_at: '2019-10-16T12:58:53.721Z',
          has_unmerged_commits: true,
        },
      ],
    };
    const orgs = {
      ...defaultState.orgs,
      task1: {
        Dev: null,
        QA: {
          ...defaultState.orgs.task1.Dev,
          org_type: 'QA',
          latest_commit: 'parent',
          has_been_visited: true,
        },
      },
    };

    test('opens submit review modal', () => {
      const { getByText, queryByText } = setup({
        initialState: {
          ...defaultState,
          tasks,
          orgs,
        },
      });
      fireEvent.click(getByText('Submit Review'));

      expect(getByText('Submit Task Review')).toBeVisible();

      fireEvent.click(getByText('Cancel'));

      expect(queryByText('Submit Task Review')).toBeNull();
    });

    describe('form submit', () => {
      test('submits task review', () => {
        const { getByText, baseElement } = setup({
          initialState: {
            ...defaultState,
            tasks,
            orgs,
          },
        });
        fireEvent.click(getByText('Submit Review'));
        const submit = baseElement.querySelector('.slds-button[type="submit"]');
        fireEvent.click(submit);

        expect(getByText('Submitting Review…')).toBeVisible();
        expect(createObject).toHaveBeenCalledTimes(1);
        expect(createObject).toHaveBeenCalledWith({
          url: window.api_urls.task_review('task1'),
          data: {
            notes: '',
            status: 'Approved',
            delete_org: true,
            org: 'org-id',
          },
          hasForm: true,
          shouldSubscribeToObject: false,
        });
      });

      test('submits task review without org', () => {
        const { getByText, baseElement } = setup({
          initialState: {
            ...defaultState,
            tasks: {
              ...defaultState.tasks,
              epic1: [
                {
                  ...defaultState.tasks.epic1[0],
                  pr_is_open: true,
                  assigned_qa: { id: 'user-id', login: 'user-name' },
                  commits: [],
                  origin_sha: 'parent',
                  review_submitted_at: '2019-10-16T12:58:53.721Z',
                  has_unmerged_commits: true,
                  review_valid: true,
                },
              ],
            },
            orgs: { task1: { Dev: null, QA: null } },
          },
        });
        fireEvent.click(getByText('Update Review'));
        const submit = baseElement.querySelector('.slds-button[type="submit"]');
        fireEvent.click(submit);

        expect(getByText('Submitting Review…')).toBeVisible();
        expect(createObject).toHaveBeenCalledTimes(1);
        expect(createObject).toHaveBeenCalledWith({
          url: window.api_urls.task_review('task1'),
          data: {
            notes: '',
            status: 'Approved',
            delete_org: false,
            org: null,
          },
          hasForm: true,
          shouldSubscribeToObject: false,
        });
      });
    });
  });

  describe('step actions', () => {
    const defaultTask = {
      id: 'task1',
      review_valid: false,
      review_status: '',
      pr_is_open: false,
      status: TASK_STATUSES.PLANNED,
      assigned_dev: null,
      assigned_qa: null,
      has_unmerged_commits: false,
      commits: [],
      origin_sha: 'parent_sha',
    };
    const defaultDevOrg = {
      id: 'dev-org',
      task: 'task1',
      org_type: 'Dev',
      owner: 'user-id',
      owner_gh_username: 'user-name',
      url: '/foo/',
      is_created: true,
      has_unsaved_changes: false,
      valid_target_directories: {},
    };
    const defaultTestOrg = {
      id: 'review-org',
      task: 'task1',
      org_type: 'QA',
      owner: 'user-id',
      owner_gh_username: 'user-name',
      url: '/bar/',
      is_created: true,
      has_been_visited: false,
    };
    const testOrgVisited = {
      has_been_visited: true,
      latest_commit: 'foo',
    };
    const jonny = {
      id: 'user-id',
      login: 'user-name',
    };
    const taskWithDev = {
      assigned_dev: jonny,
      status: TASK_STATUSES.IN_PROGRESS,
    };
    const taskWithChanges = {
      ...taskWithDev,
      has_unmerged_commits: true,
      commits: [
        { id: 'foo', timestamp: '2019-08-16T12:58:53.721Z', author: {} },
      ],
    };
    const taskWithPR = {
      ...taskWithChanges,
      pr_is_open: true,
    };
    const taskWithTester = {
      ...taskWithPR,
      assigned_qa: jonny,
    };

    test.each([
      ['assign-dev', {}, null, null, 'Assign a Developer', 'Assign Developer'],
      [
        'create-dev-org',
        taskWithDev,
        null,
        null,
        'Create a Scratch Org for development',
        'Creating Org…',
      ],
      [
        'retrieve-changes',
        taskWithDev,
        { has_unsaved_changes: true, total_unsaved_changes: 1 },
        null,
        'Retrieve changes from Dev Org',
        'Select the location to retrieve changes',
      ],
      [
        'submit-changes',
        taskWithChanges,
        {},
        null,
        'Submit changes for testing',
        'Submit this task for testing',
      ],
      ['assign-qa', taskWithPR, {}, null, 'Assign a Tester', 'Assign Tester'],
      [
        'create-qa-org',
        taskWithTester,
        {},
        null,
        'Create a Scratch Org for testing',
        'Creating Org…',
      ],
      [
        'refresh-test-org',
        taskWithTester,
        {},
        {},
        'Refresh Test Org',
        refreshOrg,
      ],
      [
        'submit-review',
        taskWithTester,
        {},
        testOrgVisited,
        'Submit a review',
        'Submit Task Review',
      ],
    ])(
      'step action click: %s',
      (name, taskOpts, devOrgOpts, testOrgOpts, trigger, expected) => {
        const task = {
          ...defaultState.tasks.epic1[0],
          ...defaultTask,
          ...taskOpts,
        };
        let devOrg, testOrg;
        if (devOrgOpts === null) {
          devOrg = null;
        } else {
          devOrg = { ...defaultDevOrg, ...devOrgOpts };
        }
        if (testOrgOpts === null) {
          testOrg = null;
        } else {
          testOrg = { ...defaultTestOrg, ...testOrgOpts };
        }
        const orgs = {
          Dev: devOrg,
          QA: testOrg,
        };
        const { getByText } = setup({
          initialState: {
            ...defaultState,
            tasks: {
              ...defaultState.tasks,
              epic1: [task],
            },
            orgs: {
              ...defaultState.orgs,
              task1: orgs,
            },
          },
        });
        fireEvent.click(getByText(trigger));

        if (typeof expected === 'string') {
          expect(getByText(expected)).toBeVisible();
        } else {
          expect(expected).toHaveBeenCalledTimes(1);
        }
      },
    );
  });

  describe('assign user click', () => {
    test('opens/closed modal', () => {
      const { getByText, queryByText } = setup();
      fireEvent.click(getByText('Assign'));

      expect(getByText('Assign Tester')).toBeVisible();

      fireEvent.click(getByText('Cancel'));

      expect(queryByText('Assign Tester')).toBeNull();
    });
  });
});
