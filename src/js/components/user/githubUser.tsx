import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Modal from '@salesforce/design-system-react/components/modal';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useEffect, useState } from 'react';

import { GitHubUser } from '@/store/repositories/reducer';

interface TableCellProps {
  [key: string]: any;
  item?: GitHubUser;
}

export const GitHubUserAvatar = ({ user }: { user: GitHubUser }) => (
  <Avatar
    imgAlt={user.login}
    imgSrc={user.avatar_url}
    title={user.login}
    size="small"
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
    bodyClassName="slds-card__body_inner"
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
  <div className="slds-grid slds-wrap slds-grid_pull-padded-xx-small">
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

const UserTableCell = ({ item, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const { login } = item;
  return (
    <DataTableCell {...props} title={login} className="collaborator-grid">
      <GitHubUserAvatar user={item} />
      <span className="collaborator-username">{login}</span>
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
}: {
  allUsers: GitHubUser[];
  selectedUsers: GitHubUser[];
  heading: string;
  isOpen: boolean;
  onRequestClose: () => void;
  setUsers: (users: GitHubUser[]) => void;
}) => {
  const [selection, setSelection] = useState(selectedUsers);
  const reset = () => setSelection(selectedUsers);

  // When selected users change, update row selection
  useEffect(() => {
    reset();
  }, [selectedUsers]); // eslint-disable-line react-hooks/exhaustive-deps

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
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={handleClose} />,
        <Button
          key="submit"
          type="submit"
          label={i18n.t('Save')}
          variant="brand"
          onClick={handleSubmit}
        />,
      ]}
      onRequestClose={handleClose}
    >
      <DataTable
        className="align-checkboxes"
        items={allUsers}
        selectRows="checkbox"
        selection={selection}
        onRowChange={updateSelection}
        noRowHover
      >
        <DataTableColumn
          label={i18n.t('GitHub Username')}
          property="login"
          primaryColumn
          truncate
        >
          <UserTableCell />
        </DataTableColumn>
      </DataTable>
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
  emptyMessageAction,
  onRequestClose,
  setUser,
}: {
  allUsers: GitHubUser[];
  selectedUser: GitHubUser | null;
  heading: string;
  isOpen: boolean;
  emptyMessageAction: () => void;
  onRequestClose: () => void;
  setUser: (user: GitHubUser | null) => void;
}) => {
  const filteredUsers = allUsers.filter((user) => user.id !== selectedUser?.id);

  return (
    <Modal isOpen={isOpen} heading={heading} onRequestClose={onRequestClose}>
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
            {i18n.t('Assign To User')}
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
          {i18n.t('There are no collaborators on this project')}.{' '}
          <Button
            label={i18n.t('Add collaborators to the project')}
            variant="link"
            onClick={emptyMessageAction}
          />{' '}
          {i18n.t('before assigning them to this task')}.
        </div>
      )}
    </Modal>
  );
};
