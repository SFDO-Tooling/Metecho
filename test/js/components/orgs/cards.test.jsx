import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import OrgCards from '@/components/orgs/cards';
import { createObject } from '@/store/actions';

import { renderWithRedux, storeWithThunk } from '../../utils';

jest.mock('@/store/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  createObject.mockClear();
});

const defaultOrgs = {
  Dev: {
    id: 'org-id',
    task: 'task-id',
    org_type: 'Dev',
    owner: 'user-id',
    last_modified_at: '2019-08-16T12:58:53.721Z',
    expires_at: '2019-09-16T12:58:53.721Z',
    latest_commit: '617a51',
    latest_commit_url: '/test/commit/url/',
    url: '/test/org/url/',
    has_changes: true,
  },
  QA: null,
};
const defaultState = {
  user: {
    id: 'user-id',
    valid_token_for: 'sf-org',
    is_devhub_enabled: true,
  },
};

describe('<OrgCards/>', () => {
  const setup = options => {
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
      expect(getByText('Has uncaptured changes')).toBeVisible();
      expect(getByText('Create Org')).toBeVisible();
    });
  });

  describe('not owned by current user', () => {
    test('renders org cards', () => {
      const orgs = {
        ...defaultOrgs,
        Dev: null,
        QA: {
          ...defaultOrgs.Dev,
          org_type: 'QA',
          owner: 'other-user',
          has_changes: false,
        },
      };
      const { queryByText, getByText } = setup({ orgs });

      expect(queryByText('View Org')).toBeNull();
      expect(getByText('All changes captured')).toBeVisible();
      expect(getByText('Create Org')).toBeVisible();
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
      expect(args.shouldSubscribeToObject({})).toBe(true);
      expect(args.shouldSubscribeToObject({ url: true })).toBe(false);
    });

    describe('with websocket', () => {
      beforeEach(() => {
        window.socket = { subscribe: jest.fn() };
      });

      afterEach(() => {
        Reflect.deleteProperty(window, 'socket');
      });

      test('subscribes to project/task', () => {
        const { getByText } = setup();
        fireEvent.click(getByText('Create Org'));

        expect(window.socket.subscribe).toHaveBeenCalledTimes(2);
        expect(window.socket.subscribe).toHaveBeenCalledWith({
          model: 'project',
          id: 'project-id',
        });
        expect(window.socket.subscribe).toHaveBeenCalledWith({
          model: 'task',
          id: 'task-id',
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
});
