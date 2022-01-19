import Button from '@salesforce/design-system-react/components/button';
import { t } from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { LabelWithSpinner } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { refreshGitHubIssues } from '@/js/store/projects/actions';

interface Props {
  projectId: string;
  isRefreshing: boolean;
  hasFetched: boolean;
  noIssues: boolean;
}

const ResyncIssuesButton = ({
  projectId,
  isRefreshing,
  hasFetched,
  noIssues,
}: Props) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const [didAutoResync, setDidAutoResync] = useState(false);
  const refreshIssues = useCallback(() => {
    dispatch(refreshGitHubIssues(projectId));
  }, [dispatch, projectId]);

  // If there are no issues, resync with GitHub...
  useEffect(() => {
    if (hasFetched) {
      if (!didAutoResync && noIssues) {
        refreshIssues();
      }
      setDidAutoResync(true);
    }
  }, [didAutoResync, hasFetched, noIssues, refreshIssues]);

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
          className="slds-grow"
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
