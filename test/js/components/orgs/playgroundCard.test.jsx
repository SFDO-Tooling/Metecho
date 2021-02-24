import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import PlaygroundOrgCard from '~js/components/orgs/playgroundCard';
import { deleteObject } from '~js/store/actions';
import { refetchOrg, refreshOrg } from '~js/store/orgs/actions';

import { renderWithRedux, storeWithThunk } from '../../utils';

jest.mock('~js/store/actions');
jest.mock('~js/store/orgs/actions');

deleteObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
refreshOrg.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
refetchOrg.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  deleteObject.mockClear();
  refreshOrg.mockClear();
  refetchOrg.mockClear();
});

const defaultEpic = {
  id: 'epic1',
  slug: 'epic-1',
  name: 'Epic 1',
  project: 'p1',
  description: 'Epic Description',
  description_rendered: '<p>Epic Description</p>',
  github_users: [],
  status: 'In progress',
  latest_sha: '617a512',
};
const defaultOrg = {
  id: 'org-id',
  epic: 'epic-id',
  org_type: 'Playground',
  org_config_name: 'dev',
  description_rendered: '<p>This is an org.</p>',
  owner: 'user-id',
  owner_gh_username: 'user-name',
  expires_at: '2019-09-16T12:58:53.721Z',
  latest_commit: '617a512',
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
};

describe('<PlaygroundOrgCard/>', () => {
  const setup = (options) => {
    const defaults = {
      org: defaultOrg,
      epic: defaultEpic,
      repoUrl: '/my-repo/',
    };
    const opts = Object.assign({}, defaults, options);
    const ui = (
      <MemoryRouter>
        <PlaygroundOrgCard {...opts} />
      </MemoryRouter>
    );
    return renderWithRedux(ui, {}, storeWithThunk);
  };

  test('renders org card', () => {
    const { getByText } = setup({ parentLink: '/foo' });

    expect(getByText('Epic Scratch Org')).toBeVisible();
    expect(getByText('1 unretrieved change', { exact: false })).toBeVisible();
    expect(getByText('check again')).toBeVisible();
    expect(getByText('This is an org.')).toBeVisible();
    expect(getByText('Epic 1')).toBeVisible();
  });

  describe('out of date', () => {
    test('renders "Behind Latest"', () => {
      const org = {
        ...defaultOrg,
        latest_commit: 'older',
      };
      const { getByText } = setup({ org });

      expect(getByText('Behind Latest', { exact: false })).toBeVisible();
      expect(getByText('view changes')).toBeVisible();
    });

    describe('Refresh Org click', () => {
      test('calls refreshOrg action', async () => {
        const org = {
          ...defaultOrg,
          latest_commit: 'older',
        };
        const { getByText } = setup({ org });

        expect.assertions(1);
        await fireEvent.click(getByText('Refresh Org'));

        expect(refreshOrg).toHaveBeenCalledWith(org);
      });
    });
  });

  describe('refetch org click', () => {
    test('refetches org', async () => {
      const { getByText } = setup();

      expect.assertions(1);
      await fireEvent.click(getByText('check again'));

      expect(refetchOrg).toHaveBeenCalledWith(defaultOrg);
    });
  });

  describe('delete org click', () => {
    test('deletes org', async () => {
      const { findByText, getByText } = setup();
      fireEvent.click(getByText('Org Actions'));
      fireEvent.click(getByText('Delete Org'));

      expect.assertions(3);
      await findByText('Deleting Org…');

      expect(deleteObject).toHaveBeenCalledTimes(1);

      const args = deleteObject.mock.calls[0][0];

      expect(args.objectType).toEqual('scratch_org');
      expect(args.object.id).toEqual(defaultOrg.id);
    });
  });
});
