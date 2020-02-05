import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import {
  AssignUserModal,
  AssignUsersModal,
} from '@/components/user/githubUser';

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
  test('responds to user click', () => {
    const setUser = jest.fn();
    const allUsers = [
      {
        id: '123456',
        login: 'test user',
        avatar_url: 'https://example.com/avatar.png',
      },
    ];
    const { getByText } = render(
      <AssignUserModal
        allUsers={allUsers}
        selectedUser={null}
        isOpen={true}
        setUser={setUser}
      />,
    );
    fireEvent.click(getByText('test user'));

    expect(setUser).toHaveBeenCalledWith(allUsers[0]);
  });
});
