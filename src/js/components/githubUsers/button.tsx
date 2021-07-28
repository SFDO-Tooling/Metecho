import Button from '@salesforce/design-system-react/components/button';
import classNames from 'classnames';
import GitHubUserAvatar from '_js/components/githubUsers/avatar';
import ReadonlyBadge from '_js/components/githubUsers/readonlyBadge';
import { GitHubUser } from '_js/store/user/reducer';
import React from 'react';

const GitHubUserButton = ({
  user,
  isAssigned,
  isSelected,
  badgeColor,
  ...props
}: {
  user: GitHubUser;
  isAssigned?: boolean;
  isSelected?: boolean;
  badgeColor?: string;
  [key: string]: any;
}) => {
  const name = user.name ? `${user.name} (${user.login})` : user.login;
  const contents = (
    <>
      <GitHubUserAvatar user={user} />
      <span className="collaborator-username slds-m-right_x-small">{name}</span>
      {user.permissions && !user.permissions.push && (
        <ReadonlyBadge color={badgeColor || 'default'} />
      )}
    </>
  );

  return isAssigned ? (
    <div
      className="slds-button
        slds-size_full
        slds-p-around_xx-small
        collaborator-button
        is-assigned"
      title={name}
      {...props}
    >
      {contents}
    </div>
  ) : (
    <Button
      className={classNames(
        'slds-size_full',
        'slds-p-around_xx-small',
        'collaborator-button',
        {
          'is-selected': isSelected,
        },
      )}
      title={name}
      label={contents}
      variant="base"
      {...props}
    />
  );
};

export default GitHubUserButton;
