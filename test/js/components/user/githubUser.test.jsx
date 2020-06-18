import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import {
  AssignUserModal,
  AssignUsersModal,
} from '@/components/user/githubUser';

import { renderWithRedux, storeWithThunk } from '../../utils';

describe('AssignUsersModal', () => {
  test('responds to checkbox clicks', () => {
    const setUsers = jest.fn();
    const allUsers = [
      {
        id: '123456',
        login: 'test user',
        avatar_url: 'https://example.com/avatar.png',
      },
    ];
    const { getByText, getAllByLabelText } = render(
      <AssignUsersModal
        allUsers={allUsers}
        selectedUsers={[]}
        isOpen={true}
        setUsers={setUsers}
        isRefreshing={false}
        refreshUsers={() => {}}
      />,
    );
    fireEvent.click(getAllByLabelText('Select all rows')[1]);
    fireEvent.click(getByText('Save'));

    expect(setUsers).toHaveBeenCalledWith(allUsers);
  });

  describe('is re-syncing collaborators', () => {
    test('displays loading spinner', () => {
      const { getByText } = render(
        <AssignUsersModal
          allUsers={[]}
          selectedUsers={[]}
          isOpen={true}
          setUsers={() => {}}
          isRefreshing={true}
          refreshUsers={() => {}}
        />,
      );

      expect(getByText('Syncing Collaborators…')).toBeVisible();
    });
  });
});

describe('AssignUserModal', () => {
  const defaultState = {
    user: {
      id: 'user-id',
      username: 'user-name',
      valid_token_for: 'sf-org',
      is_devhub_enabled: true,
    },
  };
  const allUsers = [
    {
      id: '123456',
      login: 'test user',
      avatar_url: 'https://example.com/avatar.png',
    },
  ];
  const setup = () => ({
    ...renderWithRedux(
      <AssignUserModal allUsers={allUsers} selectedUser={null} isOpen={true} />,
      defaultState,
      storeWithThunk,
    ),
  });
  test('responds to user click', () => {
    const { getAllByTitle } = setup();
    const userBtn = getAllByTitle('test user')[0];
    fireEvent.click(userBtn);

    expect(userBtn).toHaveClass('is-selected');
  });
});
