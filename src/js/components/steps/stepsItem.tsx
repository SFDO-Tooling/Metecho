import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';

import GitHubUserAvatar from '@/js/components/githubUsers/avatar';
import { ExternalLink } from '@/js/components/utils';
import { GitHubUser } from '@/js/store/user/reducer';

export type Step = {
  label: string;
  active: boolean;
  complete: boolean;
  hidden?: boolean;
  assignee?: GitHubUser | null;
  action?: string;
  link?: string | null;
};

const StepsItem = ({
  step,
  someAssignees,
  handleAction,
}: {
  step: Step;
  someAssignees: boolean;
  handleAction?: (s: Step) => void;
}) => {
  const { t } = useTranslation();
  const isActive = step.active && !step.complete;
  const hasAssignee = Boolean(step.assignee && !step.complete);

  let label: JSX.Element | string = step.label;
  if (isActive) {
    if (step.link) {
      label = (
        <ExternalLink url={step.link} showButtonIcon>
          {step.label}
        </ExternalLink>
      );
    }
    if (step.action && handleAction) {
      const stepClicked = () => handleAction(step);
      label = (
        <Button label={step.label} onClick={stepClicked} variant="link" />
      );
    }
  }

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
          title={t('Complete')}
          assistiveText={{ label: t('Complete') }}
        />
      ) : (
        <div
          className={classNames('slds-progress__marker', {
            'slds-m-left_x-large': !hasAssignee && someAssignees,
            'slds-m-left_small': hasAssignee || !someAssignees,
          })}
        >
          {isActive && (
            <span className="slds-assistive-text">{t('Active')}</span>
          )}
        </div>
      )}
      <div
        className="slds-progress__item_content
          slds-grid
          slds-grid_align-spread"
      >
        {label}
      </div>
    </li>
  );
};

export default StepsItem;
