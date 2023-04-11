import Button from '@salesforce/design-system-react/components/button';
import classNames from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';

import GitHubUserAvatar from '@/js/components/githubUsers/avatar';
import ReadonlyBadge from '@/js/components/githubUsers/readonlyBadge';
import { GitHubUser } from '@/js/store/user/reducer';

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
  const { t } = useTranslation();

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
    <article
      className={`slds-card ${classNames(className, 'collaborator-card')}`}
    >
      <div className="slds-card__header slds-grid">
        <div className="slds-media slds-media_center slds-has-flexi-truncate">
          <div className="slds-media__figure">
            <GitHubUserAvatar user={user} />
          </div>
          <div className="slds-media__body">{name}</div>
        </div>
        <div className="slds-no-flex">
          {removeUser ? (
            <Button
              assistiveText={{ icon: t('Remove') }}
              className="overflow-shadow"
              iconCategory="utility"
              iconName="close"
              iconSize="small"
              iconVariant="border-filled"
              variant="icon"
              title={`${t('Remove')} ${name}`}
              onClick={removeUser}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
};

export const UserCards = ({
  className,
  users,
  userId,
  canRemoveUser,
  removeUser,
  twoColumn,
}: {
  className?: string;
  users: GitHubUser[];
  userId?: number | null;
  canRemoveUser?: boolean;
  removeUser?: (user: GitHubUser) => void;
  twoColumn?: boolean;
}) => (
  <div
    className={classNames(
      className,
      'slds-grid',
      'slds-wrap',
      'slds-grid_pull-padded-xx-small',
    )}
  >
    {users.map((user) => {
      const doRemoveUser =
        canRemoveUser || userId === user.id
          ? () => removeUser?.(user)
          : undefined;
      return (
        <div
          key={user.id}
          className={classNames('slds-size_1-of-1', 'slds-p-around_xx-small', {
            'slds-large-size_1-of-2': twoColumn,
          })}
        >
          <UserCard
            className="slds-card_boundary"
            user={user}
            removeUser={doRemoveUser}
            showPermissions
          />
        </div>
      );
    })}
  </div>
);

export default UserCards;
