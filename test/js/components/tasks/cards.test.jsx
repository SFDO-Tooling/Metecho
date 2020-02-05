import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import OrgCards from '@/components/tasks/cards';
import { createObject, deleteObject, updateObject } from '@/store/actions';
import { refetchOrg } from '@/store/orgs/actions';

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

afterEach(() => {
  createObject.mockClear();
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
    expires_at: '2019-09-16T12:58:53.721Z',
    latest_commit: '617a512-longlong',
    latest_commit_url: '/test/commit/url/',
    latest_commit_at: '2019-08-16T12:58:53.721Z',
    url: '/test/org/url/',
    unsaved_changes: { Foo: ['Bar'] },
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
  commits: ['sdfsdf', 'kjfs'],
  origin_sha: 'ksksdm',
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
      expect(getByText('up-to-date', { exact: false })).toBeVisible();
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
      fireEvent.click(getByText('Add collaborators to the project'));

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
        test('refetches, opens confirm modal, deletes, updates assignment', () => {
          const { getByText, rerender, store } = setup({ task });
          fireEvent.click(getByText('User Actions'));
          fireEvent.click(getByText('Change Developer'));
          fireEvent.click(getByText('other-user'));

          expect(refetchOrg).toHaveBeenCalledTimes(1);
          expect(deleteObject).not.toHaveBeenCalled();
          expect(
            getByText('Confirm Changing Developer and Deleting Dev Org'),
          ).toBeVisible();

          fireEvent.click(getByText('Confirm'));

          expect(deleteObject).toHaveBeenCalledTimes(1);
          expect(getByText('Deleting Org…')).toBeVisible();

          setup({ task, orgs: { Dev: null, QA: null }, store, rerender });

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

      test('deletes org then updates assignment', () => {
        const { getByText, store, rerender } = setup({
          orgs: {
            ...defaultOrgs,
            Dev: null,
            QA: {
              ...defaultOrgs.Dev,
              org_type: 'QA',
            },
          },
          task: { ...defaultTask, assigned_dev: null },
        });
        fireEvent.click(getByText('User Actions'));
        fireEvent.click(getByText('Remove Reviewer'));

        expect(refetchOrg).not.toHaveBeenCalled();
        expect(deleteObject).toHaveBeenCalledTimes(1);
        expect(getByText('Deleting Org…')).toBeVisible();

        setup({ task, orgs: { Dev: null, QA: null }, store, rerender });

        expect(updateObject).toHaveBeenCalledTimes(1);
        expect(updateObject.mock.calls[0][0].data.assigned_qa).toBeNull();
      });

      describe('org has changes', () => {
        test('refetches, opens confirm modal, deletes, updates assignment', () => {
          const { getByText, rerender, store } = setup({ task });
          fireEvent.click(getByText('User Actions'));
          fireEvent.click(getByText('Remove Developer'));

          expect(refetchOrg).toHaveBeenCalledTimes(1);
          expect(deleteObject).not.toHaveBeenCalled();
          expect(
            getByText('Confirm Removing Developer and Deleting Dev Org'),
          ).toBeVisible();

          fireEvent.click(getByText('Confirm'));

          expect(deleteObject).toHaveBeenCalledTimes(1);
          expect(getByText('Deleting Org…')).toBeVisible();

          setup({ task, orgs: { Dev: null, QA: null }, store, rerender });

          expect(updateObject).toHaveBeenCalledTimes(1);
          expect(updateObject.mock.calls[0][0].data.assigned_dev).toBeNull();
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
    test('renders "up to date" when synced', () => {
      const task = {
        ...defaultTask,
        commits: [],
      };
      const orgs = {
        ...defaultOrgs,
        Dev: null,
        QA: {
          ...defaultOrgs.QA,
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
          has_unsaved_changes: true,
        },
      };
      const { debug } = setup({ task, orgs });
      debug();
    });
    test('opens refresh org modal', () => {
      const orgs = {
        ...defaultOrgs,
        QA: {
          ...defaultOrgs.QA,
          id: 'qa-org-id',
          task: 'task-id',
          org_type: 'QA',
          owner: 'user-id',
          owner_gh_username: 'user-name',
          expires_at: '2019-09-16T12:58:53.721Z',
          latest_commit: '617a512-longlong',
          latest_commit_url: '/test/commit/url/',
          latest_commit_at: '2019-08-16T12:58:53.721Z',
          url: '/test/org/url/',
          unsaved_changes: { Foo: ['Bar'] },
          has_unsaved_changes: true,
        },
      };
      const { getByTitle, queryAllByText } = setup({ orgs });
      const footer = queryAllByText('View Org');

      fireEvent.click(footer[1]);

      fireEvent.click(getByTitle('Close'));
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
      let orgs;

      beforeEach(() => {
        orgs = {
          Dev: null,
          QA: {
            ...defaultOrgs.Dev,
            owner: 'other-user-id',
            owner_gh_username: 'other-user',
            org_type: 'QA',
            unsaved_changes: {},
            has_unsaved_changes: false,
          },
        };
      });

      test('deletes org', () => {
        const { getByText } = setup({ orgs });
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
              fireEvent.click(getByText('Confirm'));

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
