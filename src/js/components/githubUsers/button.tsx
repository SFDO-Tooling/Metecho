import Badge from '@salesforce/design-system-react/components/badge';
import Button from '@salesforce/design-system-react/components/button';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';

import GitHubUserAvatar from '~js/components/githubUsers/avatar';
import { GitHubUser } from '~js/store/user/reducer';

const GitHubUserButton = ({
  user,
  isAssigned,
  isSelected,
  showPermissions,
  ...props
}: {
  user: GitHubUser;
  isAssigned?: boolean;
  isSelected?: boolean;
  showPermissions?: boolean;
  [key: string]: any;
}) => {
  const name = user.name ? `${user.name} (${user.login})` : user.login;
  return (
    <Button
      className={classNames(
        'slds-size_full',
        'slds-p-around_xx-small',
        'collaborator-button',
        {
          'is-assigned': isAssigned,
          'is-selected': isSelected,
        },
      )}
      title={name}
      label={
        <>
          <GitHubUserAvatar user={user} />
          <span className="collaborator-username slds-m-right_x-small">{name}</span>
          {showPermissions && !user.permissions?.push && (
            <Badge
              content={i18n.t('read-only')}
              color="light"
              className="slds-col_bump-left slds-m-right_x-small"
            />
          )}
        </>
      }
      variant="base"
      disabled={isSelected || isAssigned}
      {...props}
    />
  );
};

export default GitHubUserButton;
