import Button from '@salesforce/design-system-react/components/button';
import classNames from 'classnames';
import React from 'react';

import GitHubUserAvatar from '~js/components/githubUsers/avatar';
import { GitHubUser } from '~js/store/user/reducer';

// includes avatar, username and full name
const GitHubUserButton = ({
  user,
  isAssigned,
  isSelected,
  ...props
}: {
  user: GitHubUser;
  isAssigned?: boolean;
  isSelected?: boolean;
  [key: string]: any;
}) => {
  const name = user.name ? `${user.login} (${user.name})` : user.login;
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
          <span className="collaborator-username">{name}</span>
        </>
      }
      variant="base"
      disabled={isSelected || isAssigned}
      {...props}
    />
  );
};

export default GitHubUserButton;
