import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import OrgCards from '@/components/tasks/cards';
import { createObject, deleteObject, updateObject } from '@/store/actions';
import { refetchOrg, refreshOrg } from '@/store/orgs/actions';

import { renderWithRedux, storeWithThunk } from '../../utils';

jest.mock('@/store/actions');
jest.mock('@/store/orgs/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
deleteObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
updateObject.mockReturnValue(() =>
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
  deleteObject.mockClear();
  updateObject.mockClear();
  refetchOrg.mockClear();
  refreshOrg.mockClear();
});

const defaultOrgs = {
  Dev: {
    id: 'org-id',
    task: 'task-id',
    org_type: 'Dev',
    owner: 'user-id',
    owner_gh_username: 'user-name',
    expires_at: '2019-09-16T12:58:53.721Z',
    latest_commit: '617a512-longlong',
    latest_commit_url: '/test/commit/url/',
    latest_commit_at: '2019-08-16T12:58:53.721Z',
    url: '/test/org/url/',
    unsaved_changes: { Foo: ['Bar'] },
    total_unsaved_changes: 1,
    has_unsaved_changes: true,
  },
  QA: null,
};
const defaultState = {
  user: {
    id: 'user-id',
    username: 'user-name',
    valid_token_for: 'sf-org',
    is_devhub_enabled: true,
  },
};
const defaultTask = {
  id: 'task-id',
  assigned_dev: { id: 'user-id', login: 'user-name' },
  assigned_qa: { id: 'user-id', login: 'user-name' },
  commits: [{ id: '617a512-longlong' }, { id: 'other' }],
  origin_sha: 'parent',
  review_submitted_at: '2019-10-16T12:58:53.721Z',
};
const defaultProjectUsers = [
  { id: 'user-id', login: 'user-name' },
  { id: 'other-user', login: 'other-user' },
];

describe('<OrgCards/>', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      orgs: defaultOrgs,
      task: defaultTask,
      projectUsers: defaultProjectUsers,
      rerender: false,
    };
    const opts = Object.assign({}, defaults, options);
    const context = {};
    return {
      ...renderWithRedux(
        <StaticRouter context={context}>
          <OrgCards
            orgs={opts.orgs}
            task={opts.task}
            projectUsers={opts.projectUsers}
            projectUrl="project-url"
          />
        </StaticRouter>,
        opts.initialState,
        storeWithThunk,
        opts.rerender,
        opts.store,
      ),
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
      expect(
        getByText('has 1 uncaptured change', { exact: false }),
      ).toBeVisible();
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

  describe('not owned by current user', () => {
    test('renders org cards', () => {
      const orgs = {
        ...defaultOrgs,
        Dev: {
          ...defaultOrgs.Dev,
          owner: 'other-user-id',
          owner_gh_username: 'other-user',
          unsaved_changes: {},
          total_unsaved_changes: 0,
          has_unsaved_changes: false,
        },
      };
      const task = {
        ...defaultTask,
        assigned_dev: {
          login: 'other-user',
        },
        assigned_qa: {
          login: 'other-user',
        },
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
          owner: 'other-user',
          owner_gh_username: 'other-user',
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
      const { getByText } = setup({ task, orgs: {} });
      fireEvent.click(getByText('Assign'));
      fireEvent.click(getByText('other-user'));

      expect(updateObject).toHaveBeenCalled();
      expect(updateObject.mock.calls[0][0].data.assigned_dev.login).toEqual(
        'other-user',
      );
    });

    test('redirects to project-detail if no users to assign', () => {
      const task = {
        ...defaultTask,
        assigned_dev: null,
      };
      const projectUsers = [];
      const { getByText, context } = setup({ task, projectUsers });
      fireEvent.click(getByText('Assign'));
      fireEvent.click(getByText('View Project to Add Collaborators'));

      expect(context.action).toEqual('PUSH');
      expect(context.url).toEqual('project-url');
    });
  });

  describe('Change Reviewer click', () => {
    test('updates assigned user', () => {
      const task = {
        ...defaultTask,
        assigned_dev: null,
      };
      const { getByText } = setup({ task, orgs: {} });
      fireEvent.click(getByText('User Actions'));
      fireEvent.click(getByText('Change Reviewer'));
      fireEvent.click(getByText('other-user'));

      expect(updateObject).toHaveBeenCalled();
      expect(updateObject.mock.calls[0][0].data.assigned_qa.login).toEqual(
        'other-user',
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
        test('refetches, opens confirm modal, updates assignment', () => {
          const { getByText } = setup({ task });
          fireEvent.click(getByText('User Actions'));
          fireEvent.click(getByText('Change Developer'));
          fireEvent.click(getByText('other-user'));

          expect(refetchOrg).toHaveBeenCalledTimes(1);
          expect(updateObject).not.toHaveBeenCalled();
          expect(
            getByText('Confirm Changing Developer and Deleting Dev Org'),
          ).toBeVisible();

          fireEvent.click(getByText('Confirm'));

          expect(updateObject).toHaveBeenCalledTimes(1);
          expect(updateObject.mock.calls[0][0].data.assigned_dev.login).toEqual(
            'other-user',
          );
        });
      });
    });
  });

  describe('Remove Reviewer click', () => {
    test('removes assigned user', () => {
      const task = {
        ...defaultTask,
        assigned_dev: null,
      };
      const { getByText } = setup({ task, orgs: {} });
      fireEvent.click(getByText('User Actions'));
      fireEvent.click(getByText('Remove Reviewer'));

      expect(updateObject).toHaveBeenCalled();
      expect(updateObject.mock.calls[0][0].data.assigned_qa).toBeNull();
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
            const { getByText, queryByText } = result;
            fireEvent.click(getByText('Cancel'));

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
            task: { ...defaultTask, commits: [], origin_sha: null },
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

          expect(getByText('Review Org Behind Latest: 1 Commit')).toBeVisible();

          fireEvent.click(getByTitle('Close'));

          expect(queryByText('Review Org Behind Latest: 1 Commit')).toBeNull();
        });

        test('displays modal even if unsure how many commits behind', () => {
          const { getByText } = setup({
            orgs: {
              ...orgs,
              QA: { ...orgs.QA, latest_commit: 'not-a-commit-we-know-about' },
            },
          });
          fireEvent.click(getByText('View Org'));

          expect(getByText('Review Org Behind Latest')).toBeVisible();
        });
      });

      describe('Refresh Org click', () => {
        test('calls refreshOrg action', () => {
          const { getByText } = setup({ orgs });
          fireEvent.click(getByText('View Org'));
          fireEvent.click(getByText('Refresh Review Org'));

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
      test('opens submit review modal', () => {
        const { getByText, queryByText } = setup({
          task: { ...defaultTask, commits: [], pr_is_open: true },
          orgs: {
            ...orgs,
            QA: { ...orgs.QA, latest_commit: 'parent', has_been_visited: true },
          },
        });
        fireEvent.click(getByText('Submit Review'));

        expect(getByText('Submit Task Review')).toBeVisible();

        fireEvent.click(getByText('Cancel'));

        expect(queryByText('Submit Task Review')).toBeNull();
      });

      test('updates default fields when props change', () => {
        let task = { ...defaultTask, commits: [], pr_is_open: true };
        const theseOrgs = {
          ...orgs,
          QA: { ...orgs.QA, latest_commit: 'parent', has_been_visited: true },
        };
        const {
          getByText,
          getByLabelText,
          queryByLabelText,
          store,
          rerender,
        } = setup({
          task,
          orgs: theseOrgs,
        });
        fireEvent.click(getByText('Submit Review'));

        expect(getByLabelText('Approve')).toBeChecked();
        expect(getByLabelText('Request changes')).not.toBeChecked();

        task = {
          ...task,
          review_valid: true,
          review_status: 'Changes requested',
        };
        setup({ task, orgs: theseOrgs, store, rerender });

        expect(getByLabelText('Approve')).not.toBeChecked();
        expect(getByLabelText('Request changes')).toBeChecked();
        expect(getByLabelText('Delete Review Org')).toBeChecked();

        setup({ task, orgs: { Dev: null, QA: null }, store, rerender });

        expect(queryByLabelText('Delete Review Org')).toBeNull();
      });

      describe('form submit', () => {
        test('submits task for review', () => {
          const { getByText, baseElement } = setup({
            task: { ...defaultTask, commits: [], pr_is_open: true },
            orgs: {
              ...orgs,
              QA: {
                ...orgs.QA,
                latest_commit: 'parent',
                has_been_visited: true,
              },
            },
          });
          fireEvent.click(getByText('Submit Review'));
          const submit = baseElement.querySelector(
            '.slds-button[type="submit"]',
          );
          fireEvent.click(submit);

          expect(getByText('Submitting Review…')).toBeVisible();
          expect(createObject).toHaveBeenCalledTimes(1);
          expect(createObject).toHaveBeenCalledWith({
            url: window.api_urls.task_review('task-id'),
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
      });

      test('currently submitting', () => {
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
          });

          expect(getByText('Review Changes in Org')).toBeVisible();
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

      expect(createObject).toHaveBeenCalledWith({
        objectType: 'scratch_org',
        data: {
          org_type: 'QA',
          task: 'task-id',
        },
      });
      expect(getByText('Creating Org…')).toBeVisible();
    });

    describe('connected to global devhub', () => {
      test('creates a new org', () => {
        const { getByText } = setup({
          initialState: {
            user: {
              ...defaultState.user,
              valid_token_for: null,
              uses_global_devhub: true,
            },
          },
        });
        fireEvent.click(getByText('Create Org'));

        expect(createObject).toHaveBeenCalledWith({
          objectType: 'scratch_org',
          data: {
            org_type: 'QA',
            task: 'task-id',
          },
        });
        expect(getByText('Creating Org…')).toBeVisible();
      });
    });

    describe('not connected to sf org', () => {
      test('opens connect modal', () => {
        const { getByText } = setup({
          initialState: {
            user: { ...defaultState.user, valid_token_for: null },
          },
        });
        fireEvent.click(getByText('Create Org'));

        expect(createObject).not.toHaveBeenCalled();
        expect(getByText('Use Custom Domain')).toBeVisible();
      });
    });

    describe('dev hub not enabled', () => {
      test('opens warning modal', () => {
        const { getByText } = setup({
          initialState: {
            user: { ...defaultState.user, is_devhub_enabled: false },
          },
        });
        fireEvent.click(getByText('Create Org'));

        expect(createObject).not.toHaveBeenCalled();
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

        expect(getByText('Checking for Uncaptured Changes…')).toBeVisible();
      });
    });
  });

  describe('delete org click', () => {
    describe('QA org', () => {
      test('deletes org', () => {
        const task = {
          ...defaultTask,
          assigned_qa: {
            login: 'other-user',
          },
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
        const { getByText } = setup({ orgs, task });
        fireEvent.click(getByText('Org Actions'));
        fireEvent.click(getByText('Delete Org'));

        expect(deleteObject).toHaveBeenCalledTimes(1);

        const args = deleteObject.mock.calls[0][0];

        expect(args.objectType).toEqual('scratch_org');
        expect(args.object.id).toEqual('org-id');
        expect(getByText('Deleting Org…')).toBeVisible();
      });
    });

    describe('Dev org', () => {
      test('refreshes and then deletes org', () => {
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
        });
        fireEvent.click(getByText('Org Actions'));
        fireEvent.click(getByText('Delete Org'));

        expect(refetchOrg).toHaveBeenCalledTimes(1);

        const refetchArgs = refetchOrg.mock.calls[0][0];

        expect(refetchArgs.id).toEqual('org-id');
        expect(deleteObject).toHaveBeenCalledTimes(1);

        const deleteArgs = deleteObject.mock.calls[0][0];

        expect(deleteArgs.objectType).toEqual('scratch_org');
        expect(deleteArgs.object.id).toEqual('org-id');
        expect(getByText('Deleting Org…')).toBeVisible();
      });

      describe('org has changes', () => {
        test('opens confirm modal', () => {
          const { getByTitle, getByText } = setup();
          fireEvent.click(getByText('Org Actions'));
          fireEvent.click(getByTitle('Delete Org'));

          expect(deleteObject).not.toHaveBeenCalled();
          expect(
            getByText('Confirm Deleting Org With Uncaptured Changes'),
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
              const { getByText, queryByText } = result;
              fireEvent.click(getByText('Cancel'));

              expect(
                queryByText('Confirm Deleting Org With Uncaptured Changes'),
              ).toBeNull();
            });
          });

          describe('"delete" click', () => {
            test('deletes org', () => {
              const { getByText, queryByText } = result;
              fireEvent.click(getByText('Delete'));

              expect(
                queryByText('Confirm Deleting Org With Uncaptured Changes'),
              ).toBeNull();
              expect(deleteObject).toHaveBeenCalledTimes(1);

              const args = deleteObject.mock.calls[0][0];

              expect(args.objectType).toEqual('scratch_org');
              expect(args.object.id).toEqual('org-id');
              expect(getByText('Deleting Org…')).toBeVisible();
            });
          });
        });
      });
    });
  });
});
