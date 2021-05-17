import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';

import GitHubUserAvatar from '~js/components/githubUsers/avatar';
import ReadonlyBadge from '~js/components/githubUsers/readonlyBadge';
import { GitHubUser } from '~js/store/user/reducer';

export const UserCard = ({
  user,
  removeUser,
  className,
  showPermissions,
}: {
  user: GitHubUser;
  removeUser?: () => void;
  className?: string;
  showPermissions?: boolean;
}) => {
  let name: string | JSX.Element = user.name
    ? `${user.name} (${user.login})`
    : user.login;
  if (showPermissions && user.permissions && !user.permissions.push) {
    name = (
      <>
        <span title={name} className="slds-m-right_x-small">
          {name}
        </span>
        <ReadonlyBadge />
      </>
    );
  }
  return (
    <Card
      className={classNames(className, 'collaborator-card')}
      icon={<GitHubUserAvatar user={user} />}
      heading={name}
      headerActions={
        removeUser ? (
          <Button
            assistiveText={{ icon: i18n.t('Remove') }}
            className="overflow-shadow"
            iconCategory="utility"
            iconName="close"
            iconSize="small"
            iconVariant="border-filled"
            variant="icon"
            title={i18n.t('Remove')}
            onClick={removeUser}
          />
        ) : null
      }
    />
  );
};

export const UserCards = ({
  users,
  userId,
  canRemoveUser,
  removeUser,
}: {
  users: GitHubUser[];
  userId: string | null;
  canRemoveUser: boolean;
  removeUser: (user: GitHubUser) => void;
}) => (
  <div
    className="slds-grid
      slds-wrap
      slds-grid_pull-padded-xx-small
      slds-m-top_large"
  >
    {users.map((user) => {
      const doRemoveUser =
        canRemoveUser || userId === user.id
          ? () => removeUser(user)
          : undefined;
      return (
        <div key={user.id} className="slds-size_1-of-1 slds-p-around_xx-small">
          <UserCard user={user} removeUser={doRemoveUser} showPermissions />
        </div>
      );
    })}
  </div>
);

export default UserCards;
