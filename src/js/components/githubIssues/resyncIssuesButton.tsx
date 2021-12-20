import Button from '@salesforce/design-system-react/components/button';
import { t } from 'i18next';
import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { LabelWithSpinner } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { refreshGitHubIssues } from '@/js/store/projects/actions';

interface Props {
  isRefreshing: boolean;
  projectId: string;
  forceResync: boolean;
}

const ResyncIssuesButton = ({
  isRefreshing,
  projectId,
  forceResync,
}: Props) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const refreshIssues = useCallback(() => {
    dispatch(refreshGitHubIssues(projectId));
  }, [dispatch, projectId]);

  // If there are no issues, resync with GitHub...
  useEffect(() => {
    if (forceResync) {
      refreshIssues();
    }
  }, [forceResync, refreshIssues]);

  return (
    <>
      {isRefreshing ? (
        <Button
          label={<LabelWithSpinner label={t('Syncing GitHub Issues…')} />}
          variant="outline-brand"
          disabled
        />
      ) : (
        <Button
          label={t('Re-Sync Issues')}
          variant="outline-brand"
          iconCategory="utility"
          iconName="refresh"
          iconPosition="left"
          onClick={refreshIssues}
        />
      )}
    </>
  );
};

export default ResyncIssuesButton;
