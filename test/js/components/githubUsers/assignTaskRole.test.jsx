import { fireEvent } from '@testing-library/react';
import React from 'react';

import AssignTaskRoleModal from '~js/components/githubUsers/assignTaskRole';
import { refreshGitHubUsers } from '~js/store/projects/actions';

import { renderWithRedux, storeWithThunk } from '../../utils';

jest.mock('~js/store/projects/actions');

refreshGitHubUsers.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  refreshGitHubUsers.mockClear();
});

describe('AssignTaskRole', () => {
  const defaultState = {
    user: {
      id: 'user-id',
      github_id: 'user-id',
      username: 'user-name',
      name: 'User Name',
      valid_token_for: 'sf-org',
      is_devhub_enabled: true,
    },
  };
  const githubUsers = [
    {
      id: 'user-id',
      login: 'user-name',
      name: 'User Name',
      avatar_url: 'https://example.com/avatar.png',
      permissions: { push: true },
    },
    {
      id: '123456',
      login: 'test user',
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.png',
      permissions: { push: true },
    },
  ];
  const epicUsers = githubUsers.slice(1);
  const setUser = jest.fn();
  const onRequestClose = jest.fn();

  const setup = (props) => ({
    ...renderWithRedux(
      <AssignTaskRoleModal
        projectId="p1"
        epicUsers={epicUsers}
        githubUsers={githubUsers}
        selectedUser={null}
        orgType="Dev"
        isOpen
        isRefreshingUsers={false}
        onRequestClose={onRequestClose}
        setUser={setUser}
        {...props}
      />,
      defaultState,
      storeWithThunk,
    ),
  });

  test('responds to epic user click', () => {
    const { getByText, getAllByTitle } = setup();
    const userBtn = getAllByTitle('Test User (test user)')[0];
    fireEvent.click(userBtn);
    fireEvent.click(getByText('Save'));

    expect(setUser).toHaveBeenCalledWith(epicUsers[0].id, true);
  });

  test('responds to github user click', () => {
    const { getByText, getAllByTitle } = setup();
    const userBtn = getAllByTitle('User Name (user-name)')[0];
    fireEvent.click(userBtn);
    fireEvent.click(getByText('Save'));

    expect(setUser).toHaveBeenCalledWith(githubUsers[0].id, false);
  });

  test('can filter by name/username', () => {
    const { getAllByText, getByPlaceholderText, getByText, queryByText } =
      setup();
    const input = getByPlaceholderText('Search for user');

    expect(queryByText('No users found.')).toBeNull();

    fireEvent.change(input, { target: { value: 'test user' } });

    expect(getByText('No users found.')).toBeVisible();

    fireEvent.change(input, { target: { value: 'User Name' } });

    expect(getByText('No users found.')).toBeVisible();

    fireEvent.change(input, { target: { value: 'nope' } });

    expect(getAllByText('No users found.')).toHaveLength(2);
  });

  test('closes on Cancel click', () => {
    const { getByTitle } = setup();
    fireEvent.click(getByTitle('Cancel'));

    expect(onRequestClose).toHaveBeenCalled();
  });

  describe('"re-sync collaborators" click', () => {
    test('updates users', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Re-Sync GitHub Collaborators'));

      expect(refreshGitHubUsers).toHaveBeenCalledWith('p1');
    });
  });

  describe('is re-syncing github users', () => {
    test('displays loading spinner', () => {
      const { getByText } = setup({ isRefreshingUsers: true });

      expect(getByText('Syncing GitHub Collaborators…')).toBeVisible();
    });
  });
});
