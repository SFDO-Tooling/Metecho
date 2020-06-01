import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';

import { GitHubUserAvatar } from '@/components/user/githubUser';
import { GitHubUser } from '@/store/user/reducer';

export type Step = {
  label: string;
  visible: boolean;
  active: boolean;
  complete: boolean;
  assignee: GitHubUser | null;
};
const StepsItem = ({
  step,
  isActive,
  hasAssignee,
}: {
  step: Step;
  isActive: boolean;
  hasAssignee: boolean;
}) => (
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
            'slds-m-left_x-large': !hasAssignee,
            'slds-m-left_small': hasAssignee,
          },
        )}
        title={i18n.t('Complete')}
        assistiveText={{ label: i18n.t('Complete') }}
      />
    ) : (
      <div
        className={classNames('slds-progress__marker', {
          'slds-m-left_x-large': !hasAssignee,
          'slds-m-left_small': hasAssignee,
        })}
      >
        {isActive && (
          <span className="slds-assistive-text">{i18n.t('Active')}</span>
        )}
      </div>
    )}
    <div
      className="slds-progress__item_content
                      slds-grid
                      slds-grid_align-spread"
    >
      {step.label}
    </div>
  </li>
);

export default StepsItem;
