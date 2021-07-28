import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import { some } from 'lodash';
import { LabelWithSpinner } from '_js/components/utils';
import { ThunkDispatch } from '_js/store';
import { refreshGitHubUsers } from '_js/store/projects/actions';
import { GitHubUser } from '_js/store/user/reducer';
import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

interface Props {
  isRefreshing: boolean;
  projectId: string;
  githubUsers: GitHubUser[];
}

const RefreshGitHubUsersButton = ({
  isRefreshing,
  projectId,
  githubUsers,
}: Props) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const refreshUsers = useCallback(() => {
    dispatch(refreshGitHubUsers(projectId));
  }, [dispatch, projectId]);

  // If users are missing permissions, check again once...
  useEffect(() => {
    if (!githubUsers.length || some(githubUsers, (u) => !u.permissions)) {
      refreshUsers();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {isRefreshing ? (
        <Button
          label={
            <LabelWithSpinner label={i18n.t('Syncing GitHub Collaborators…')} />
          }
          variant="outline-brand"
          disabled
        />
      ) : (
        <Button
          label={i18n.t('Re-Sync GitHub Collaborators')}
          variant="outline-brand"
          iconCategory="utility"
          iconName="refresh"
          iconPosition="left"
          onClick={refreshUsers}
        />
      )}
    </>
  );
};

export default RefreshGitHubUsersButton;
