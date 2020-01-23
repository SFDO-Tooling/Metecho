import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import { AssignUsersModal } from '@/components/projects/repositoryGitHubUsers';

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
        users={[]}
        isOpen={true}
        onRequestClose={jest.fn()}
        setUsers={setUsers}
      />,
    );
    fireEvent.click(getAllByLabelText('Select all rows')[1]);
    fireEvent.click(getByText('Save'));

    expect(setUsers).toHaveBeenCalledWith(allUsers);
  });
});
