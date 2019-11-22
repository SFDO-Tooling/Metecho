import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import OrgCards from '@/components/orgs/cards';
import { createObject, deleteObject } from '@/store/actions';
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
refetchOrg.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  createObject.mockClear();
  deleteObject.mockClear();
  refetchOrg.mockClear();
});

const defaultOrgs = {
  Dev: {
    id: 'org-id',
    task: 'task-id',
    org_type: 'Dev',
    owner: 'user-id',
    expires_at: '2019-09-16T12:58:53.721Z',
    latest_commit: '617a512-longlong',
    latest_commit_url: '/test/commit/url/',
    latest_commit_at: '2019-08-16T12:58:53.721Z',
    url: '/test/org/url/',
    unsaved_changes: { Foo: ['Bar'] },
    has_unsaved_changes: true,
    owner_sf_id: 'username',
  },
  QA: null,
};
const defaultState = {
  user: {
    id: 'user-id',
    valid_token_for: 'sf-org',
    is_devhub_enabled: true,
    sf_username: 'username',
  },
};

describe('<OrgCards/>', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      orgs: defaultOrgs,
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, orgs } = opts;
    return renderWithRedux(
      <MemoryRouter>
        <OrgCards
          orgs={orgs}
          task={{ id: 'task-id' }}
          project={{ id: 'project-id' }}
        />
      </MemoryRouter>,
      initialState,
      storeWithThunk,
    );
  };

  describe('owned by current user', () => {
    test('renders org cards', () => {
      const { getByText } = setup();

      expect(getByText('View Org')).toBeVisible();
      expect(
        getByText('has 1 uncaptured change', { exact: false }),
      ).toBeVisible();
      expect(getByText('Create Org')).toBeVisible();
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
          owner: 'other-user',
          unsaved_changes: {},
          has_unsaved_changes: false,
        },
      };
      const { queryByText, getByText } = setup({ orgs });

      expect(queryByText('View Org')).toBeNull();
      expect(getByText('up-to-date', { exact: false })).toBeVisible();
      expect(queryByText('check again')).toBeNull();
    });
  });

  describe('QA org', () => {
    test('renders without status', () => {
      const orgs = {
        ...defaultOrgs,
        Dev: null,
        QA: {
          ...defaultOrgs.Dev,
          org_type: 'QA',
        },
      };
      const { queryByText, getByText } = setup({ orgs });

      expect(getByText('View Org')).toBeVisible();
      expect(
        queryByText('has 1 uncaptured change', { exact: false }),
      ).toBeNull();
    });
  });

  describe('create org click', () => {
    test('creates a new org', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Create Org'));

      expect(createObject).toHaveBeenCalledTimes(1);

      const args = createObject.mock.calls[0][0];

      expect(args.objectType).toEqual('scratch_org');
      expect(args.data).toEqual({
        org_type: 'QA',
        task: 'task-id',
      });
      expect(args.shouldSubscribeToObject()).toBe(true);
      expect(getByText('Creating Org…')).toBeVisible();
    });

    describe('with websocket', () => {
      beforeEach(() => {
        window.socket = { subscribe: jest.fn() };
      });

      afterEach(() => {
        Reflect.deleteProperty(window, 'socket');
      });

      test('subscribes to project', () => {
        const { getByText } = setup();
        fireEvent.click(getByText('Create Org'));

        expect(window.socket.subscribe).toHaveBeenCalledWith({
          model: 'project',
          id: 'project-id',
        });
      });
    });

    describe('not connected to sf org', () => {
      test('opens connect modal', () => {
        const { getByText } = setup({ initialState: { user: {} } });
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
            org_type: 'QA',
            unsaved_changes: {},
            has_unsaved_changes: false,
          },
        };
      });

      test('deletes org', () => {
        const { getByText } = setup({ orgs });
        fireEvent.click(getByText('Actions'));
        fireEvent.click(getByText('Delete'));

        expect(deleteObject).toHaveBeenCalledTimes(1);

        const args = deleteObject.mock.calls[0][0];

        expect(args.objectType).toEqual('scratch_org');
        expect(args.object.id).toEqual('org-id');
        expect(getByText('Deleting Org…')).toBeVisible();
      });

      describe('not connected to sf org', () => {
        test('opens connect modal', () => {
          const { getByTitle, getByText } = setup({
            orgs,
            initialState: {
              ...defaultState,
              user: { ...defaultState.user, valid_token_for: null },
            },
          });
          fireEvent.click(getByText('Actions'));
          fireEvent.click(getByTitle('Delete'));

          expect(deleteObject).not.toHaveBeenCalled();
          expect(getByText('Use Custom Domain')).toBeVisible();
        });
      });

      describe('not user who created org', () => {
        test('opens connect modal', () => {
          const { getByTitle, getByText } = setup({
            orgs,
            initialState: {
              ...defaultState,
              user: { ...defaultState.user, sf_username: 'other-user' },
            },
          });
          fireEvent.click(getByText('Actions'));
          fireEvent.click(getByTitle('Delete'));

          expect(deleteObject).not.toHaveBeenCalled();
          expect(
            getByText('Salesforce User Does Not Have Required Permissions'),
          ).toBeVisible();
        });
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
        fireEvent.click(getByText('Actions'));
        fireEvent.click(getByText('Delete'));

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
          fireEvent.click(getByText('Actions'));
          fireEvent.click(getByTitle('Delete'));

          expect(deleteObject).not.toHaveBeenCalled();
          expect(getByText('Confirm Delete Org')).toBeVisible();
        });

        describe('<ConfirmDeleteModal />', () => {
          let result;

          beforeEach(() => {
            result = setup();
            fireEvent.click(result.getByText('Actions'));
            fireEvent.click(result.getByTitle('Delete'));
          });

          describe('"cancel" click', () => {
            test('closes modal', () => {
              const { getByText, queryByText } = result;
              fireEvent.click(getByText('Cancel'));

              expect(queryByText('Confirm Delete Org')).toBeNull();
            });
          });

          describe('"delete" click', () => {
            test('deletes org', () => {
              const { getByText, queryByText } = result;
              fireEvent.click(getByText('Delete'));

              expect(queryByText('Confirm Delete Org')).toBeNull();
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
