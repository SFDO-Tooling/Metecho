import Card from '@salesforce/design-system-react/components/card';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React from 'react';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '@/js/store';
import { updateObject } from '@/js/store/actions';
import { Epic } from '@/js/store/epics/reducer';
import { Task } from '@/js/store/tasks/reducer';
import { OBJECT_TYPES } from '@/js/utils/constants';

import { useFetchIssues } from '../utils';
import { GitHubIssueLink } from './selectIssueModal';

interface Props {
  epic?: Epic | null;
  task?: Task | null;
}

const IssueCard = ({ epic, task }: Props) => {
  const { issues } = useFetchIssues({
    projectId: epic ? epic.project : task?.project,
    isAttached: true,
    isOpen: true,
  });

  const dispatch = useDispatch<ThunkDispatch>();

  const issue =
    (issues && issues?.find((i) => i.id === epic?.issue || task?.issue)) ||
    /* istanbul ignore next */ null;

  const unlink = () => {
    if (epic?.issue) {
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.EPIC,
          url: window.api_urls.epic_detail(epic.id),
          data: {
            ...epic,
            issue: null,
          },
        }),
      );
    } else {
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.TASK,
          url: window.api_urls.task_detail(task.id),
          data: {
            ...task,
            issue: null,
          },
        }),
      );
    }
  };

  return (
    <>
      {(epic?.issue || task?.issue) && (
        <Card
          bodyClassName="slds-card__body_inner"
          className="wrap-inner-truncate narrow-buttons playground-org-card"
          heading={`#${issue?.number}: ${issue?.title}`}
          headerActions={
            epic?.issue || task?.issue ? (
              <Dropdown
                align="right"
                buttonClassName="slds-button_icon-x-small"
                buttonVariant="icon"
                iconCategory="utility"
                iconName="down"
                iconSize="small"
                iconVariant="border-filled"
                triggerClassName="metecho-card-more"
                width="xx-small"
                options={[
                  {
                    id: 0,
                    label: epic
                      ? i18n.t('Unlink From Epic')
                      : i18n.t('Unlink From Task'),
                  },
                ]}
                onSelect={unlink}
              />
            ) : null
          }
          footer={<GitHubIssueLink url={issue?.html_url} />}
        ></Card>
      )}
    </>
  );
};

export default IssueCard;
