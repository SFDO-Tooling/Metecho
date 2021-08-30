import { fireEvent } from '@testing-library/react';
import React from 'react';

import AssignEpicCollaboratorsModal from '@/js/components/githubUsers/assignEpicCollaborators';
import { refreshGitHubUsers } from '@/js/store/projects/actions';

import { renderWithRedux } from '../../utils';

jest.mock('@/js/store/projects/actions');

refreshGitHubUsers.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  refreshGitHubUsers.mockClear();
});

describe('AssignEpicCollaboratorsModal', () => {
  test('responds to checkbox clicks', () => {
    const setUsers = jest.fn();
    const allUsers = [
      {
        id: '123456',
        login: 'test user',
        avatar_url: 'https://example.com/avatar.png',
        permissions: { push: true },
      },
      {
        id: 'readonly',
        login: 'readonly-user',
        avatar_url: 'https://example.com/avatar.png',
        permissions: { push: false },
      },
    ];
    const { getByText, getAllByLabelText } = renderWithRedux(
      <AssignEpicCollaboratorsModal
        allUsers={allUsers}
        selectedUsers={[]}
        isOpen
        setUsers={setUsers}
        isRefreshing={false}
        projectId="p1"
      />,
    );

    fireEvent.click(getAllByLabelText('Select all rows')[0]);
    fireEvent.click(getByText('Save'));

    expect(setUsers).toHaveBeenCalledWith(allUsers);
  });

  describe('is re-syncing collaborators', () => {
    test('displays loading spinner', () => {
      const { getByText } = renderWithRedux(
        <AssignEpicCollaboratorsModal
          allUsers={[]}
          selectedUsers={[]}
          isOpen
          setUsers={() => {}}
          isRefreshing
          projectId="p1"
        />,
      );

      expect(getByText('Syncing GitHub Collaborators…')).toBeVisible();
    });
  });
});
