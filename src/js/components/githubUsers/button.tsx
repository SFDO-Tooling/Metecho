import Button from '@salesforce/design-system-react/components/button';
import classNames from 'classnames';
import React from 'react';

import GitHubUserAvatar from '~js/components/githubUsers/avatar';
import ReadonlyBadge from '~js/components/githubUsers/readonlyBadge';
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
          <span className="collaborator-username slds-m-right_x-small">
            {name}
          </span>
          {showPermissions && user.permissions && !user.permissions.push && (
            <ReadonlyBadge color="light" />
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
