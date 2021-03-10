import { fireEvent } from '@testing-library/react';
import React from 'react';

import AssignUserModal from '~js/components/user/github/assignUserModal';

import { renderWithRedux, storeWithThunk } from '../../../utils';

describe('AssignUserModal', () => {
  const defaultState = {
    user: {
      id: 'user-id',
      username: 'user-name',
      valid_token_for: 'sf-org',
      is_devhub_enabled: true,
    },
    // @@@ export from fixtures....
  };
  const epicUsers = [
    {
      id: '123456',
      login: 'test user',
      avatar_url: 'https://example.com/avatar.png',
    },
  ];
  const project = {
    id: 'p1',
    name: 'Sample Project',
    slug: 'my-project',
    old_slugs: [],
    repo_url: 'https://github.com/test/test-repo',
    repo_owner: 'test',
    repo_name: 'test-repo',
    description: 'This is *safely* rendered Markdown.',
    description_rendered: '<p>This is <em>safely</em> rendered Markdown.</p>',
    is_managed: false,
    branch_prefix: '',
    github_users: [
      {
        id: '123456',
        login: 'TestGitHubUser',
        avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
      },
    ],
    currently_refreshing_gh_users: false,
    repo_image_url:
      'https://repository-images.githubusercontent.com/123456/123-456',
    currently_fetching_org_config_names: false,
    org_config_names: [],
    latest_sha: 'abc123',
  };

  const setUser = jest.fn();
  const onRequestClose = jest.fn();

  const setup = () => ({
    ...renderWithRedux(
      <AssignUserModal
        epicUsers={epicUsers}
        selectedUser={null}
        orgType="Dev"
        project={project}
        isOpen
        setUser={setUser}
        onRequestClose={onRequestClose}
      />,
      defaultState,
      storeWithThunk,
    ),
  });

  test('responds to user click', () => {
    const { getByText, getAllByTitle } = setup();
    const userBtn = getAllByTitle('test user')[0];
    fireEvent.click(userBtn);
    fireEvent.click(getByText('Save'));

    expect(setUser).toHaveBeenCalledWith(epicUsers[0], true);
  });

  test('closes on Cancel click', () => {
    const { getByText } = setup();
    fireEvent.click(getByText('Cancel'));

    expect(onRequestClose).toHaveBeenCalled();
  });
});
