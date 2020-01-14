import { fireEvent } from '@testing-library/react';
import React from 'react';

import { AvailableUserCards } from '@/components/projects/repositoryGitHubUsers';

import { renderWithRedux } from './../../utils';

describe('AvailableUserCards', () => {
  test('responds to checkbox clicks', () => {
    const setUsers = jest.fn();
    const allUsers = [
      {
        id: '123456',
        login: 'test user',
        avatar_url: 'https://example.com/avatar.png',
      },
    ];
    const { getAllByRole } = renderWithRedux(
      <AvailableUserCards
        allUsers={allUsers}
        users={[]}
        isOpen={true}
        onRequestClose={jest.fn()}
        setUsers={setUsers}
      />,
    );
    // We click checkbox 1 because checkbox 0 is the "select all" checkbox in
    // the header:
    fireEvent.click(getAllByRole('checkbox')[1]);
    // This is just the submit button. I don't know a better way to identify
    // it?
    fireEvent.click(getAllByRole('button')[2]);
    expect(setUsers).toHaveBeenCalledWith(allUsers);
  });
});
