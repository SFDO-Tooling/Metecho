import { fireEvent } from '@testing-library/react';
import React from 'react';

import AssignEpicCollaboratorsModal from '~js/components/githubUsers/assignEpicCollaborators';

import { render } from '../../utils';

describe('AssignEpicCollaboratorsModal', () => {
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
      <AssignEpicCollaboratorsModal
        allUsers={allUsers}
        selectedUsers={[]}
        isOpen
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
        <AssignEpicCollaboratorsModal
          allUsers={[]}
          selectedUsers={[]}
          isOpen
          setUsers={() => {}}
          isRefreshing
          refreshUsers={() => {}}
        />,
      );

      expect(getByText('Syncing GitHub Collaborators…')).toBeVisible();
    });
  });
});
