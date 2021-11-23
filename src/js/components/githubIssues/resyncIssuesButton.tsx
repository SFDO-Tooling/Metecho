import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { LabelWithSpinner } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { refreshGitHubIssues } from '@/js/store/projects/actions';

interface Props {
  isRefreshing: boolean;
  projectId: string;
}

const ResyncIssuesButton = ({ isRefreshing, projectId }: Props) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const refreshUsers = useCallback(() => {
    dispatch(refreshGitHubIssues(projectId));
  }, [dispatch, projectId]);

  return (
    <>
      {isRefreshing ? (
        <Button
          label={
            <LabelWithSpinner label={i18n.t('Syncing GitHub Issues...')} />
          }
          variant="outline-brand"
          disabled
        />
      ) : (
        <Button
          label={i18n.t('Re-Sync Issues')}
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

export default ResyncIssuesButton;
