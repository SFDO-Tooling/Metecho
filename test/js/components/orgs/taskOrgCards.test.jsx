import { fireEvent, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import TaskOrgCards, {
  ORG_TYPE_TRACKER_DEFAULT,
} from '~js/components/orgs/taskOrgCards';
import { deleteObject, updateObject } from '~js/store/actions';
import { refetchOrg } from '~js/store/orgs/actions';

import {
  renderWithRedux,
  reRenderWithRedux,
  storeWithThunk,
} from '../../utils';

jest.mock('~js/store/actions');
jest.mock('~js/store/orgs/actions');

deleteObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
updateObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
refetchOrg.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  deleteObject.mockClear();
  updateObject.mockClear();
  refetchOrg.mockClear();
});

const defaultOrgs = {
  Dev: {
    id: 'org-id',
    task: 'task-id',
    org_type: 'Dev',
    owner: 'user-id',
    owner_gh_username: 'user-name',
    owner_gh_id: 'user-id',
    expires_at: '2019-09-16T12:58:53.721Z',
    latest_commit: '617a512-longlong',
    latest_commit_url: '/test/commit/url/',
    latest_commit_at: '2019-08-16T12:58:53.721Z',
    url: '/test/org/url/',
    unsaved_changes: { Foo: ['Bar'] },
    total_unsaved_changes: 1,
    has_unsaved_changes: true,
    ignored_changes: {},
    total_ignored_changes: 0,
    has_ignored_changes: false,
    is_created: true,
  },
  QA: null,
};
const defaultEpicUsers = [
  {
    id: 'user-id',
    login: 'user-name',
    name: 'Full User Name',
    permissions: { push: true },
  },
  { id: 'other-user-id', login: 'other-user', permissions: { push: true } },
];
const defaultProject = {
  id: 'p1',
  github_users: [...defaultEpicUsers],
};
const defaultState = {
  user: {
    id: 'user-id',
    github_id: 'user-id',
    username: 'user-name',
    valid_token_for: 'sf-org',
    is_devhub_enabled: true,
  },
  projects: {
    projects: [defaultProject],
  },
};
const defaultTask = {
  id: 'task-id',
  assigned_dev: 'user-id',
  assigned_qa: 'user-id',
  commits: [{ id: '617a512-longlong' }, { id: 'other' }],
  origin_sha: 'parent',
  review_submitted_at: '2019-10-16T12:58:53.721Z',
  has_unmerged_commits: true,
};
const createOrg = jest.fn();
const refreshOrg = jest.fn();

describe('<TaskOrgCards/>', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      orgs: defaultOrgs,
      task: defaultTask,
      userHasPermissions: true,
      epicUsers: defaultEpicUsers,
      githubUsers: defaultEpicUsers,
      assignUserModalOpen: null,
      isCreatingOrg: ORG_TYPE_TRACKER_DEFAULT,
      testOrgReadyForReview: false,
      testOrgSubmittingReview: false,
      rerender: false,
    };
    const opts = Object.assign({}, defaults, options);
    const context = {};
    const ui = (
      <StaticRouter context={context}>
        <TaskOrgCards
          orgs={opts.orgs}
          task={opts.task}
          projectId={defaultProject.id}
          userHasPermissions={opts.userHasPermissions}
          epicUsers={opts.epicUsers}
          githubUsers={opts.githubUsers}
          epicUrl="epic-url"
          assignUserModalOpen={opts.assignUserModalOpen}
          isCreatingOrg={opts.isCreatingOrg}
          testOrgReadyForReview={opts.testOrgReadyForReview}
          testOrgSubmittingReview={opts.testOrgSubmittingReview}
          openAssignUserModal={jest.fn()}
          closeAssignUserModal={jest.fn()}
          openSubmitReviewModal={jest.fn()}
          doCreateOrg={createOrg}
          doRefreshOrg={refreshOrg}
        />
      </StaticRouter>
    );
    if (opts.rerender) {
      return {
        ...reRenderWithRedux(ui, opts.store, opts.rerender),
        context,
      };
    }
    return {
      ...renderWithRedux(ui, opts.initialState, storeWithThunk),
      context,
    };
  };

  describe('owned by current user', () => {
    test('renders org cards', () => {
      const task = {
        ...defaultTask,
        assigned_qa: null,
      };
      const { getByText } = setup({ task });

      expect(getByText('View Org')).toBeVisible();
      expect(getByText('1 unretrieved change', { exact: false })).toBeVisible();
      expect(getByText('Assign')).toBeVisible();
      expect(getByText('check again')).toBeVisible();
      expect(getByText('617a512')).toBeVisible();
    });

    test('renders without commit URL', () => {
      const orgs = {
        ...defaultOrgs,
        Dev: {
          ...defaultOrgs.Dev,
          latest_commit_url: '',
        },
      };
      const { getByText } = setup({ orgs });

      expect(getByText('617a512')).toBeVisible();
    });
  });

  describe('org has ignored changes', () => {
    test('renders card status', () => {
      const orgs = {
        ...defaultOrgs,
        Dev: {
          ...defaultOrgs.Dev,
          has_ignored_changes: true,
          total_ignored_changes: 1,
          ignored_changes: { Foo: ['Bar'] },
        },
      };
      const { getByText } = setup({ orgs });

      expect(getByText('1 ignored')).toBeVisible();
    });
  });

  describe('not owned by current user', () => {
    test('renders org cards', () => {
      const orgs = {
        ...defaultOrgs,
        Dev: {
          ...defaultOrgs.Dev,
          owner: 'other-user-id',
          owner_gh_username: 'other-user',
          owner_gh_id: 'other-user-id',
          unsaved_changes: {},
          total_unsaved_changes: 0,
          has_unsaved_changes: false,
        },
      };
      const task = {
        ...defaultTask,
        assigned_dev: 'other-user-id',
        assigned_qa: 'other-user-id',
      };
      const { queryByText, getByText } = setup({ orgs, task });

      expect(queryByText('View Org')).toBeNull();
      expect(getByText('up to date', { exact: false })).toBeVisible();
      expect(queryByText('check again')).toBeNull();
      expect(getByText('not yet created', { exact: false })).toBeVisible();
    });
  });

  describe('not owned by assigned user', () => {
    test('renders org cards', () => {
      const orgs = {
        ...defaultOrgs,
        Dev: {
          ...defaultOrgs.Dev,
          owner: 'other-user-id',
          owner_gh_username: 'other-user',
          owner_gh_id: 'other-user-id',
        },
      };
      const { queryByText, getByText } = setup({ orgs });

      expect(queryByText('View Org')).toBeNull();
      expect(getByText('owned by user', { exact: false })).toBeVisible();
    });
  });

  describe('Assign click', () => {
    test('updates assigned user', () => {
      const task = {
        ...defaultTask,
        assigned_dev: null,
      };
      const { getByText, baseElement } = setup({
        task,
        orgs: {},
        assignUserModalOpen: 'Dev',
      });
      fireEvent.click(
        baseElement.querySelector(
          '.collaborator-button[title="Full User Name (user-name)"]',
        ),
      );
      fireEvent.click(getByText('Notify Assigned Developer by Email'));
      fireEvent.click(getByText('Save'));

      expect(updateObject).toHaveBeenCalled();

      const data = updateObject.mock.calls[0][0].data;

      expect(data.assigned_dev).toEqual('user-id');
      expect(data.should_alert_dev).toBe(true);
    });

    test('self-assigns readonly user as tester', () => {
      const task = {
        ...defaultTask,
        assigned_qa: null,
      };
      const { getByText } = setup({
        task,
        orgs: {},
        userHasPermissions: false,
      });
      fireEvent.click(getByText('Self-Assign'));

      expect(updateObject).toHaveBeenCalled();

      const data = updateObject.mock.calls[0][0].data;

      expect(data.assigned_qa).toEqual('user-id');
      expect(data.should_alert_qa).toBe(false);
    });

    test('readonly user cannot assign dev role', () => {
      const task = {
        ...defaultTask,
        assigned_dev: null,
      };
      const { queryByText } = setup({
        task,
        orgs: {},
        userHasPermissions: false,
      });

      expect(queryByText('Self-Assign')).toBeNull();
    });
  });

  describe('Change Tester click', () => {
    test('updates assigned user', () => {
      const task = {
        ...defaultTask,
        assigned_dev: null,
      };
      const { getByText } = setup({
        task,
        orgs: {},
        assignUserModalOpen: 'QA',
      });
      fireEvent.click(getByText('other-user'));
      fireEvent.click(getByText('Save'));

      expect(updateObject).toHaveBeenCalled();
      expect(updateObject.mock.calls[0][0].data.assigned_qa).toEqual(
        'other-user-id',
      );
    });
  });

  describe('Change Developer click', () => {
    describe('removed user has scratch org', () => {
      const task = {
        ...defaultTask,
        assigned_qa: null,
      };

      describe('org has changes', () => {
        test('refetches, opens confirm modal, updates assignment', async () => {
          fetchMock.postOnce(window.api_urls.task_can_reassign(task.id), {
            can_reassign: false,
          });
          const { findByText, getByText } = setup({
            task,
            assignUserModalOpen: 'Dev',
          });
          fireEvent.click(getByText('other-user'));
          fireEvent.click(getByText('Save'));

          expect.assertions(5);
          await findByText('Confirm');

          expect(refetchOrg).toHaveBeenCalledTimes(1);
          expect(updateObject).not.toHaveBeenCalled();
          expect(
            getByText('Confirm Changing Developer and Deleting Dev Org'),
          ).toBeVisible();

          fireEvent.click(getByText('Confirm'));

          expect(updateObject).toHaveBeenCalledTimes(1);
          expect(updateObject.mock.calls[0][0].data.assigned_dev).toEqual(
            'other-user-id',
          );
        });
      });

      describe('org can be reassigned', () => {
        test('updates assignment without refetching', async () => {
          fetchMock.postOnce(window.api_urls.task_can_reassign(task.id), {
            can_reassign: true,
          });
          const { getByText } = setup({ task, assignUserModalOpen: 'Dev' });
          fireEvent.click(getByText('other-user'));
          fireEvent.click(getByText('Save'));

          expect.assertions(3);
          await waitFor(() => {
            if (!updateObject.mock.calls.length) {
              throw new Error('waiting...');
            }
          });

          expect(refetchOrg).not.toHaveBeenCalled();
          expect(updateObject).toHaveBeenCalledTimes(1);
          expect(updateObject.mock.calls[0][0].data.assigned_dev).toEqual(
            'other-user-id',
          );
        });
      });
    });
  });

  describe('Remove Tester click', () => {
    test('removes assigned user', () => {
      const task = {
        ...defaultTask,
        assigned_dev: null,
      };
      const { getByText } = setup({ task, orgs: {} });
      fireEvent.click(getByText('User Actions'));
      fireEvent.click(getByText('Remove Tester'));

      expect(updateObject).toHaveBeenCalled();
      expect(updateObject.mock.calls[0][0].data.assigned_qa).toBeNull();
    });

    test('readonly user can remove self', () => {
      const task = {
        ...defaultTask,
        assigned_dev: null,
      };
      const { getByText } = setup({
        task,
        orgs: {},
        userHasPermissions: false,
      });
      fireEvent.click(getByText('User Actions'));
      fireEvent.click(getByText('Remove Tester'));

      expect(updateObject).toHaveBeenCalled();
      expect(updateObject.mock.calls[0][0].data.assigned_qa).toBeNull();
    });

    test('readonly user cannot remove other user', () => {
      const task = {
        ...defaultTask,
        assigned_dev: null,
        assigned_qa: 'other-user',
      };
      const { queryByText } = setup({
        task,
        orgs: {},
        userHasPermissions: false,
      });

      expect(queryByText('User Actions')).toBeNull();
    });
  });

  describe('Remove User click', () => {
    describe('removed user has scratch org', () => {
      const task = {
        ...defaultTask,
        assigned_qa: null,
      };

      test('refetches, then updates assignment', () => {
        const { getByText } = setup({
          orgs: {
            ...defaultOrgs,
            Dev: {
              ...defaultOrgs.Dev,
              unsaved_changes: {},
              total_unsaved_changes: 0,
              has_unsaved_changes: false,
            },
          },
          task: { ...defaultTask, assigned_qa: null },
        });
        fireEvent.click(getByText('User Actions'));
        fireEvent.click(getByText('Remove Developer'));

        expect(refetchOrg).toHaveBeenCalledTimes(1);
        expect(updateObject).toHaveBeenCalledTimes(1);
        expect(updateObject.mock.calls[0][0].data.assigned_dev).toBeNull();
      });

      describe('org has changes', () => {
        test('refetches, opens confirm modal, updates assignment', () => {
          const { getByText } = setup({ task });
          fireEvent.click(getByText('User Actions'));
          fireEvent.click(getByText('Remove Developer'));

          expect(refetchOrg).toHaveBeenCalledTimes(1);
          expect(updateObject).not.toHaveBeenCalled();
          expect(
            getByText('Confirm Removing Developer and Deleting Dev Org'),
          ).toBeVisible();

          fireEvent.click(getByText('Confirm'));

          expect(updateObject).toHaveBeenCalledTimes(1);
          expect(updateObject.mock.calls[0][0].data.assigned_dev).toBeNull();
        });
      });

      describe('<ConfirmRemoveUserModal />', () => {
        let result;

        beforeEach(() => {
          result = setup({ task });
          fireEvent.click(result.getByText('User Actions'));
          fireEvent.click(result.getByText('Remove Developer'));
        });

        describe('"cancel" click', () => {
          test('closes modal', () => {
            const { getByTitle, queryByText } = result;
            fireEvent.click(getByTitle('Cancel'));

            expect(
              queryByText('Confirm Removing Developer and Deleting Dev Org'),
            ).toBeNull();
          });
        });

        describe('"confirm" click', () => {
          test('removes user', () => {
            const { getByText, queryByText } = result;
            fireEvent.click(getByText('Confirm'));

            expect(
              queryByText('Confirm Removing Developer and Deleting Dev Org'),
            ).toBeNull();
            expect(updateObject).toHaveBeenCalledTimes(1);
            expect(updateObject.mock.calls[0][0].data.assigned_dev).toBeNull();
          });
        });
      });
    });
  });

  describe('Commit Status', () => {
    test('no status without latest_commit', () => {
      const orgs = {
        ...defaultOrgs,
        Dev: {
          ...defaultOrgs.Dev,
          latest_commit: null,
        },
      };
      const { queryByText } = setup({ orgs });

      expect(queryByText('Deployed Commit')).toBeNull();
    });
  });

  describe('QA org', () => {
    const orgs = {
      ...defaultOrgs,
      Dev: null,
      QA: {
        ...defaultOrgs.Dev,
        org_type: 'QA',
        latest_commit: 'other',
      },
    };

    test('renders "Up to Date"', () => {
      const { getByText } = setup({
        task: { ...defaultTask, commits: [] },
        orgs: { ...orgs, QA: { ...orgs.QA, latest_commit: 'parent' } },
      });

      expect(getByText('Up to Date')).toBeVisible();
    });

    describe('out of date', () => {
      test('renders "Behind Latest"', () => {
        const { getByText } = setup({ orgs });

        expect(getByText('Behind Latest', { exact: false })).toBeVisible();
        expect(getByText('view changes')).toBeVisible();
      });

      describe('unknown commits list', () => {
        test('does not render compare changes link', () => {
          const { getByText, queryByText } = setup({
            task: { ...defaultTask, commits: [], origin_sha: '' },
            orgs,
          });

          expect(getByText('Behind Latest', { exact: false })).toBeVisible();
          expect(queryByText('view changes')).toBeNull();
        });
      });

      describe('View Org click', () => {
        test('opens refresh org modal', () => {
          const { getByText, getByTitle, queryByText } = setup({ orgs });
          fireEvent.click(getByText('View Org'));

          expect(getByText('Test Org Behind Latest: 1 Commit')).toBeVisible();

          fireEvent.click(getByTitle('Close'));

          expect(queryByText('Test Org Behind Latest: 1 Commit')).toBeNull();
        });

        test('displays modal even if unsure how many commits behind', () => {
          const { getByText } = setup({
            orgs: {
              ...orgs,
              QA: { ...orgs.QA, latest_commit: 'not-a-commit-we-know-about' },
            },
          });
          fireEvent.click(getByText('View Org'));

          expect(getByText('Test Org Behind Latest')).toBeVisible();
        });
      });

      describe('Refresh Org click', () => {
        test('calls refreshOrg action', () => {
          const { getByText } = setup({ orgs });
          fireEvent.click(getByText('View Org'));
          fireEvent.click(getByText('Refresh Test Org'));

          expect(refreshOrg).toHaveBeenCalledWith(orgs.QA);
        });
      });

      describe('currently refreshing', () => {
        test('calls refreshOrg action', () => {
          const { getByText } = setup({
            orgs: {
              ...orgs,
              QA: { ...orgs.QA, currently_refreshing_org: true },
            },
          });

          expect(getByText('Refreshing Org…')).toBeVisible();
        });
      });
    });

    describe('submitting a review', () => {
      test('shows status of currently submitting', () => {
        const { getByText } = setup({
          task: {
            ...defaultTask,
            commits: [],
            pr_is_open: true,
            currently_submitting_review: true,
          },
          orgs: {
            ...orgs,
            QA: { ...orgs.QA, latest_commit: 'parent', has_been_visited: true },
          },
          testOrgSubmittingReview: true,
        });

        expect(getByText('Submitting Review…')).toBeVisible();
      });

      describe('submit review btn', () => {
        test('updating review', () => {
          const { getByText } = setup({
            task: {
              ...defaultTask,
              commits: [],
              pr_is_open: true,
              review_valid: true,
            },
            orgs: {
              Dev: null,
              QA: null,
            },
            testOrgReadyForReview: true,
          });

          expect(getByText('Update Review')).toBeVisible();
        });

        test('org not yet visited', () => {
          const { queryByText, getByText } = setup({
            task: {
              ...defaultTask,
              commits: [],
              pr_is_open: true,
              review_valid: false,
            },
            orgs: {
              ...orgs,
              QA: {
                ...orgs.QA,
                latest_commit: 'parent',
                has_been_visited: false,
              },
            },
            testOrgReadyForReview: true,
          });

          expect(getByText('Test Changes in Org')).toBeVisible();
          expect(queryByText('Submit Review')).toBeNull();
        });
      });

      describe('orgStatus', () => {
        test('renders "Approved" status', () => {
          const { getByText } = setup({
            orgs: {
              ...orgs,
              QA: {
                ...orgs.QA,
                latest_commit: 'parent',
                has_been_visited: true,
                url: 'url',
              },
            },
            task: {
              ...defaultTask,
              commits: [],
              review_status: 'Approved',
              review_valid: true,
            },
          });

          expect(getByText('Approved')).toBeVisible();
        });

        test('renders "Changes requested" status', () => {
          const { getByText } = setup({
            orgs: {
              ...orgs,
              QA: {
                ...orgs.QA,
                latest_commit: 'parent',
                has_been_visited: true,
                url: 'url',
              },
            },
            task: {
              ...defaultTask,
              commits: [],
              review_status: 'Changes requested',
              review_valid: true,
            },
          });

          expect(
            getByText('Changes requested', { exact: false }),
          ).toBeVisible();
        });

        test('renders "Review out of date" status', () => {
          const { getByText } = setup({
            orgs: {
              ...orgs,
              QA: {
                ...orgs.QA,
                latest_commit: 'parent',
                has_been_visited: true,
                url: 'url',
              },
            },
            task: {
              ...defaultTask,
              commits: [],
              review_status: 'Approved',
              review_valid: false,
            },
          });

          expect(
            getByText('Review out of date', { exact: false }),
          ).toBeVisible();
        });
      });
    });
  });

  describe('create org click', () => {
    test('creates a new org', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Create Org'));

      expect(createOrg).toHaveBeenCalledWith('QA');
    });

    test('shows status of currently creating', () => {
      const { getByText } = setup({
        isCreatingOrg: { Dev: true, QA: false },
      });

      expect(getByText('Creating Org…')).toBeVisible();
    });

    describe('connected to global devhub', () => {
      test('creates a new org', () => {
        const { getByText } = setup({
          initialState: {
            ...defaultState,
            user: {
              ...defaultState.user,
              valid_token_for: null,
              uses_global_devhub: true,
            },
          },
        });
        fireEvent.click(getByText('Create Org'));

        expect(createOrg).toHaveBeenCalledWith('QA');
      });
    });

    describe('not connected to sf org', () => {
      test('opens connect modal', () => {
        const { getByText } = setup({
          initialState: {
            ...defaultState,
            user: { ...defaultState.user, valid_token_for: null },
          },
        });
        fireEvent.click(getByText('Create Org'));

        expect(createOrg).not.toHaveBeenCalled();
        expect(getByText('Use Custom Domain')).toBeVisible();
      });
    });

    describe('dev hub not enabled', () => {
      test('opens warning modal', () => {
        const { getByText } = setup({
          initialState: {
            ...defaultState,
            user: { ...defaultState.user, is_devhub_enabled: false },
          },
        });
        fireEvent.click(getByText('Create Org'));

        expect(createOrg).not.toHaveBeenCalled();
        expect(getByText('Enable Dev Hub')).toBeVisible();
      });
    });
  });

  describe('refetch org click', () => {
    test('refetches org', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('check again'));

      expect(refetchOrg).toHaveBeenCalledTimes(1);
      expect(refetchOrg).toHaveBeenCalledWith(defaultOrgs.Dev);
    });

    describe('refetching org', () => {
      test('displays spinner and message', () => {
        const { getByText } = setup({
          orgs: {
            ...defaultOrgs,
            Dev: {
              ...defaultOrgs.Dev,
              currently_refreshing_changes: true,
            },
          },
        });

        expect(getByText('Checking for Unretrieved Changes…')).toBeVisible();
      });
    });
  });

  describe('reassigning org', () => {
    test('displays spinner and message', () => {
      const { getByText } = setup({
        orgs: {
          ...defaultOrgs,
          Dev: {
            ...defaultOrgs.Dev,
            currently_reassigning_user: true,
          },
        },
      });

      expect(getByText('Reassigning Org Ownership…')).toBeVisible();
    });
  });

  describe('delete org click', () => {
    describe('QA org', () => {
      test('deletes org', async () => {
        const task = {
          ...defaultTask,
          assigned_qa: 'other-user-id',
        };
        const orgs = {
          Dev: null,
          QA: {
            ...defaultOrgs.Dev,
            org_type: 'QA',
            unsaved_changes: {},
            total_unsaved_changes: 0,
            has_unsaved_changes: false,
          },
        };
        const { findByText, getByText } = setup({ orgs, task });
        fireEvent.click(getByText('Org Actions'));
        fireEvent.click(getByText('Delete Org'));

        expect.assertions(3);
        await findByText('Deleting Org…');

        expect(deleteObject).toHaveBeenCalledTimes(1);

        const args = deleteObject.mock.calls[0][0];

        expect(args.objectType).toEqual('scratch_org');
        expect(args.object.id).toEqual('org-id');
      });
    });

    describe('Dev org', () => {
      test('refreshes and then deletes org', async () => {
        const { findByText, getByText } = setup({
          orgs: {
            ...defaultOrgs,
            Dev: {
              ...defaultOrgs.Dev,
              unsaved_changes: {},
              total_unsaved_changes: 0,
              has_unsaved_changes: false,
            },
          },
        });
        fireEvent.click(getByText('Org Actions'));
        fireEvent.click(getByText('Delete Org'));

        expect.assertions(5);
        await findByText('Deleting Org…');

        expect(refetchOrg).toHaveBeenCalledTimes(1);

        const refetchArgs = refetchOrg.mock.calls[0][0];

        expect(refetchArgs.id).toEqual('org-id');
        expect(deleteObject).toHaveBeenCalledTimes(1);

        const deleteArgs = deleteObject.mock.calls[0][0];

        expect(deleteArgs.objectType).toEqual('scratch_org');
        expect(deleteArgs.object.id).toEqual('org-id');
      });

      describe('org has changes', () => {
        test('opens confirm modal', () => {
          const { getByTitle, getByText } = setup();
          fireEvent.click(getByText('Org Actions'));
          fireEvent.click(getByTitle('Delete Org'));

          expect(deleteObject).not.toHaveBeenCalled();
          expect(
            getByText('Confirm Deleting Org With Unretrieved Changes'),
          ).toBeVisible();
        });

        describe('<ConfirmDeleteModal />', () => {
          let result;

          beforeEach(() => {
            result = setup();
            fireEvent.click(result.getByText('Org Actions'));
            fireEvent.click(result.getByTitle('Delete Org'));
          });

          describe('"cancel" click', () => {
            test('closes modal', () => {
              const { getByTitle, queryByText } = result;
              fireEvent.click(getByTitle('Cancel'));

              expect(
                queryByText('Confirm Deleting Org With Unretrieved Changes'),
              ).toBeNull();
            });
          });

          describe('"delete" click', () => {
            test('deletes org', async () => {
              const { findByText, getByText, queryByText } = result;
              fireEvent.click(getByText('Delete Org'));

              expect.assertions(4);
              await findByText('Deleting Org…');

              expect(
                queryByText('Confirm Deleting Org With Unretrieved Changes'),
              ).toBeNull();
              expect(deleteObject).toHaveBeenCalledTimes(1);

              const args = deleteObject.mock.calls[0][0];

              expect(args.objectType).toEqual('scratch_org');
              expect(args.object.id).toEqual('org-id');
            });
          });
        });
      });
    });
  });
});
