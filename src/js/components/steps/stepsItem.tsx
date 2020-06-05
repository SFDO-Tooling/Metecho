import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';

import { GitHubUserAvatar } from '@/components/user/githubUser';
import { GitHubUser } from '@/store/user/reducer';

export type Step = {
  label: string;
  active: boolean;
  complete: boolean;
  hidden?: boolean;
  assignee?: GitHubUser | null;
  action?: string;
};

const StepsItem = ({
  step,
  someAssignees,
  stepActionClicked,
}: {
  step: Step;
  someAssignees: boolean;
  stepActionClicked: () => void;
}) => {
  const isActive = step.active && !step.complete;
  const hasAssignee = Boolean(step.assignee && !step.complete);

  const handleAction = () => {
    stepActionClicked();
  };
  return (
    <li
      className={classNames('slds-progress__item', {
        'slds-is-completed': step.complete,
        'slds-is-active': isActive,
      })}
    >
      {hasAssignee && (
        <GitHubUserAvatar user={step.assignee as GitHubUser} size="x-small" />
      )}
      {step.complete ? (
        <Icon
          category="utility"
          name="success"
          size="x-small"
          containerClassName={classNames(
            'slds-icon_container',
            'slds-icon-utility-success',
            'slds-progress__marker',
            'slds-progress__marker_icon',
            {
              'slds-m-left_x-large': !hasAssignee && someAssignees,
              'slds-m-left_small': hasAssignee || !someAssignees,
            },
          )}
          title={i18n.t('Complete')}
          assistiveText={{ label: i18n.t('Complete') }}
        />
      ) : (
        <div
          className={classNames('slds-progress__marker', {
            'slds-m-left_x-large': !hasAssignee && someAssignees,
            'slds-m-left_small': hasAssignee || !someAssignees,
          })}
        >
          {isActive && (
            <span className="slds-assistive-text">{i18n.t('Active')}</span>
          )}
        </div>
      )}
      {step.action && step.active ? (
        <Button
          label={step.label}
          onClick={handleAction}
          variant="base"
          className="slds-progress__item_content
          slds-grid
          slds-grid_align-spread"
        />
      ) : (
        <div
          className="slds-progress__item_content
          slds-grid
          slds-grid_align-spread"
        >
          {step.label}
        </div>
      )}
    </li>
  );
};

export default StepsItem;
