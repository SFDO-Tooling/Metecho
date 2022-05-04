import Button from '@salesforce/design-system-react/components/button';
import { some } from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { LabelWithSpinner } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { refreshGitHubUsers } from '@/js/store/projects/actions';
import { GitHubUser } from '@/js/store/user/reducer';

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
  const { t } = useTranslation();
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
            <LabelWithSpinner label={t('Syncing GitHub Collaborators…')} />
          }
          variant="outline-brand"
          disabled
        />
      ) : (
        <Button
          label={t('Re-Sync GitHub Collaborators')}
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
