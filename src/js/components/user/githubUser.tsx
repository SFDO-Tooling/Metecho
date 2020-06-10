import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Modal from '@salesforce/design-system-react/components/modal';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { Trans } from 'react-i18next';

import { EmptyIllustration } from '@/components/404';
import { LabelWithSpinner, SpinnerWrapper } from '@/components/utils';
import { GitHubUser } from '@/store/user/reducer';

interface TableCellProps {
  [key: string]: any;
  item?: GitHubUser;
  handleUserClick: (user: GitHubUser) => void;
}

export const GitHubUserAvatar = ({
  user,
  size,
}: {
  user: GitHubUser;
  size?: string;
}) => (
  <Avatar
    imgAlt={`${i18n.t('avatar for user')} ${user.login}`}
    imgSrc={user.avatar_url}
    title={user.login}
    size={size || 'small'}
  />
);

export const UserCard = ({
  user,
  removeUser,
  className,
}: {
  user: GitHubUser;
  removeUser?: () => void;
  className?: string;
}) => (
  <Card
    className={classNames(className, 'collaborator-card')}
    icon={<GitHubUserAvatar user={user} />}
    heading={user.login}
    headerActions={
      removeUser && (
        <Button
          assistiveText={{ icon: i18n.t('Remove') }}
          iconCategory="utility"
          iconName="close"
          iconSize="small"
          iconVariant="border-filled"
          variant="icon"
          title={i18n.t('Remove')}
          onClick={removeUser}
        />
      )
    }
  />
);

export const UserCards = ({
  users,
  removeUser,
}: {
  users: GitHubUser[];
  removeUser: (user: GitHubUser) => void;
}) => (
  <div
    className="slds-grid
      slds-wrap
      slds-grid_pull-padded-xx-small
      slds-m-top_large"
  >
    {users.map((user) => {
      const doRemoveUser = () => removeUser(user);
      return (
        <div
          key={user.id}
          className="slds-size_1-of-1
            slds-large-size_1-of-2
            slds-p-around_xx-small"
        >
          <UserCard user={user} removeUser={doRemoveUser} />
        </div>
      );
    })}
  </div>
);

const UserTableCell = ({ item, handleUserClick, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const { login } = item;
  const handleClick = () => {
    handleUserClick(item);
  };
  return (
    <DataTableCell {...props} title={login} className="slds-p-around_none">
      <GitHubUserButton user={item} onClick={handleClick} />
    </DataTableCell>
  );
};
UserTableCell.displayName = DataTableCell.displayName;

export const AssignUsersModal = ({
  allUsers,
  selectedUsers,
  heading,
  isOpen,
  onRequestClose,
  setUsers,
  isRefreshing,
  refreshUsers,
}: {
  allUsers: GitHubUser[];
  selectedUsers: GitHubUser[];
  heading: string;
  isOpen: boolean;
  onRequestClose: () => void;
  setUsers: (users: GitHubUser[]) => void;
  isRefreshing: boolean;
  refreshUsers: () => void;
}) => {
  const [selection, setSelection] = useState(selectedUsers);
  const reset = useCallback(() => setSelection(selectedUsers), [selectedUsers]);

  // When selected users change, update row selection
  useEffect(() => {
    reset();
  }, [reset]);

  const handleUserClick = useCallback(
    (user: GitHubUser) => {
      const isSelected = selection.findIndex((u) => u.id === user.id) > -1;
      if (isSelected) {
        setSelection(selection.filter((u) => u.id !== user.id));
      } else {
        setSelection([...selection, user]);
      }
    },
    [selection],
  );

  // When modal is canceled, reset row selection
  const handleClose = () => {
    reset();
    onRequestClose();
  };
  const updateSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
    data: { selection: GitHubUser[] },
  ) => {
    setSelection(data.selection);
  };
  const handleSubmit = () => {
    setUsers([...selection]);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      heading={heading}
      footer={
        allUsers.length
          ? [
              <Button
                key="cancel"
                label={i18n.t('Cancel')}
                onClick={handleClose}
              />,
              <Button
                key="submit"
                type="submit"
                label={i18n.t('Save')}
                variant="brand"
                onClick={handleSubmit}
              />,
            ]
          : null
      }
      size="small"
      onRequestClose={handleClose}
    >
      <div
        className="slds-grid
          slds-grid_vertical-align-start
          slds-p-around_medium"
      >
        <div className="slds-grid slds-wrap slds-shrink slds-p-right_medium">
          <p>
            <Trans i18nKey="projectCollaborators">
              Only users who have access to the GitHub repository for this
              project will appear in the list below. Visit GitHub to invite
              additional collaborators to this repository.
            </Trans>
          </p>
        </div>
        <div
          className="slds-grid
            slds-grow
            slds-shrink-none
            slds-grid_align-end"
        >
          {isRefreshing ? (
            <Button
              label={
                <LabelWithSpinner label={i18n.t('Syncing Collaborators…')} />
              }
              variant="outline-brand"
              disabled
            />
          ) : (
            <Button
              label={i18n.t('Re-Sync Collaborators')}
              variant="outline-brand"
              iconCategory="utility"
              iconName="refresh"
              iconPosition="left"
              onClick={refreshUsers}
            />
          )}
        </div>
      </div>
      <div className="slds-is-relative">
        {allUsers.length ? (
          <DataTable
            className="align-checkboxes table-row-targets"
            items={allUsers}
            selectRows="checkbox"
            selection={selection}
            onRowChange={updateSelection}
          >
            <DataTableColumn
              label={i18n.t('GitHub Users')}
              property="login"
              primaryColumn
              truncate
            >
              <UserTableCell handleUserClick={handleUserClick} />
            </DataTableColumn>
          </DataTable>
        ) : (
          <div className="slds-p-around_medium">
            <EmptyIllustration
              message={
                <Trans i18nKey="noGitHubUsers">
                  We couldn’t find any GitHub users who have access to this
                  repository. Try re-syncing the list of available
                  collaborators, or contact an admin for this repository on
                  GitHub.
                </Trans>
              }
            />
          </div>
        )}
        {isRefreshing && <SpinnerWrapper />}
      </div>
    </Modal>
  );
};

const GitHubUserButton = ({
  user,
  isSelected,
  ...props
}: {
  user: GitHubUser;
  isSelected?: boolean;
  [key: string]: any;
}) => (
  <Button
    className={classNames(
      'slds-size_full',
      'slds-p-around_xx-small',
      'collaborator-button',
      {
        'is-selected': isSelected,
      },
    )}
    title={user.login}
    label={
      <>
        <GitHubUserAvatar user={user} />
        <span className="collaborator-username">{user.login}</span>
      </>
    }
    variant="base"
    disabled={isSelected}
    {...props}
  />
);

export const AssignUserModal = ({
  allUsers,
  selectedUser,
  heading,
  isOpen,
  emptyMessageText,
  emptyMessageAction,
  onRequestClose,
  setUser,
}: {
  allUsers: GitHubUser[];
  selectedUser: GitHubUser | null;
  heading: string;
  isOpen: boolean;
  emptyMessageText: string;
  emptyMessageAction: () => void;
  onRequestClose: () => void;
  setUser: (user: GitHubUser | null) => void;
}) => {
  const filteredUsers = allUsers.filter((user) => user.id !== selectedUser?.id);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      heading={heading}
      tagline={
        filteredUsers.length ? (
          <>
            {i18n.t('Only project collaborators appear in the list below.')}{' '}
            <Button
              label={i18n.t('View the project to add collaborators.')}
              variant="link"
              onClick={emptyMessageAction}
            />
          </>
        ) : null
      }
      footer={
        filteredUsers.length ? null : (
          <Button
            label={emptyMessageText}
            variant="brand"
            onClick={emptyMessageAction}
          />
        )
      }
    >
      {selectedUser && (
        <>
          <div className="slds-p-around_small">
            <div className="slds-text-title slds-m-bottom_xx-small">
              {i18n.t('Currently Assigned')}
            </div>
            <GitHubUserButton user={selectedUser} isSelected />
          </div>
          <hr className="slds-m-vertical_none slds-m-horizontal_small" />
        </>
      )}
      {filteredUsers.length ? (
        <div className="slds-p-around_small">
          <div className="slds-text-title slds-m-bottom_xx-small">
            {i18n.t('Assign To GitHub User')}
          </div>
          <ul>
            {filteredUsers.map((user) => (
              <li key={user.id}>
                <GitHubUserButton user={user} onClick={() => setUser(user)} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="slds-p-around_medium">
          {i18n.t(
            'There are no collaborators on this project. Add collaborators to the project before assigning them to this task.',
          )}
        </div>
      )}
    </Modal>
  );
};
