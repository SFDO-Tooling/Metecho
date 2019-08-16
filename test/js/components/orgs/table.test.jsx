import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import OrgsTable from '@/components/orgs/table';
import { createObject } from '@/store/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  createObject.mockClear();
});

const defaultOrgs = {
  dev: {
    id: 'org-id',
    task: 'task-id',
    type: 'dev',
    owner: 'user-id',
    last_modified: '2019-08-16T12:58:53.721Z',
    expiration: '2019-09-16T12:58:53.721Z',
    latest_commit: '617a51',
    latest_commit_url: '/test/commit/url/',
    url: '/test/org/url/',
    has_changes: true,
  },
  qa: null,
};
const defaultState = {
  user: {
    id: 'user-id',
  },
};

describe('<OrgsTable/>', () => {
  const setup = options => {
    const defaults = {
      initialState: defaultState,
      orgs: defaultOrgs,
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, orgs } = opts;
    return renderWithRedux(
      <MemoryRouter>
        <OrgsTable orgs={orgs} />
      </MemoryRouter>,
      initialState,
      storeWithThunk,
    );
  };

  describe('owned by current user', () => {
    test('renders table with orgs', () => {
      const { getByText, getByTitle } = setup();

      expect(getByText('View Org')).toBeVisible();
      expect(getByTitle('Has uncaptured changes')).toBeVisible();
      expect(getByTitle('Create New Org')).toBeVisible();
    });
  });

  describe('not owned by current user', () => {
    test('renders table with orgs', () => {
      const orgs = {
        ...defaultOrgs,
        dev: null,
        qa: {
          ...defaultOrgs.dev,
          type: 'qa',
          owner: 'other-user',
          has_changes: false,
        },
      };
      const { queryByText, getByTitle } = setup({ orgs });

      expect(queryByText('View Org')).toBeNull();
      expect(getByTitle('All changes captured')).toBeVisible();
      expect(getByTitle('Create New Org')).toBeVisible();
    });
  });

  describe('create org click', () => {
    test('creates a new org', () => {
      const { getByTitle } = setup();
      fireEvent.click(getByTitle('Create New Org'));

      expect(createObject).toHaveBeenCalledWith({
        objectType: 'org',
      });
    });
  });
});
