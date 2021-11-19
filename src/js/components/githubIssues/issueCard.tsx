import Card from '@salesforce/design-system-react/components/card';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { GitHubIssueLink } from '@/js/components/githubIssues/selectIssueModal';
import { SpinnerWrapper, useFetchIssueIfMissing } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { updateObject } from '@/js/store/actions';
import { OBJECT_TYPES } from '@/js/utils/constants';

interface Props {
  issueId: string;
  epicId?: string;
  taskId?: string;
}

const IssueCard = ({ issueId, epicId, taskId }: Props) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const { issue } = useFetchIssueIfMissing({ id: issueId });

  const unlink = useCallback(() => {
    if (epicId) {
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.EPIC,
          url: window.api_urls.epic_detail(epicId),
          data: { issue: null },
          patch: true,
        }),
      );
    } else if (taskId) {
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.TASK,
          url: window.api_urls.task_detail(taskId),
          data: { issue: null },
          patch: true,
        }),
      );
    }
  }, [dispatch, epicId, taskId]);

  // If we have an attached issue id but can't find the issue, detach it.
  useEffect(() => {
    if (issue === null) {
      unlink();
    }
  }, [issue, unlink]);

  return (
    <Card
      bodyClassName="slds-card__body_inner"
      heading={
        issue
          ? `#${issue.number}: ${issue.title}`
          : i18n.t('Loading GitHub Issue…')
      }
      headerActions={
        <Dropdown
          align="right"
          assistiveText={{ icon: i18n.t('GitHub Issue Actions') }}
          buttonClassName="slds-button_icon-x-small"
          buttonVariant="icon"
          iconCategory="utility"
          iconName="down"
          iconSize="small"
          iconVariant="border-filled"
          width="xx-small"
          options={[
            {
              id: 0,
              label: epicId
                ? i18n.t('Remove from Epic')
                : i18n.t('Remove from Task'),
            },
          ]}
          onSelect={unlink}
        />
      }
      footer={issue && <GitHubIssueLink url={issue.html_url} />}
    >
      {issue === undefined && <SpinnerWrapper size="small" />}
    </Card>
  );
};

export default IssueCard;
