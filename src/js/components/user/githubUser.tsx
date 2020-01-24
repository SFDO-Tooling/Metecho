import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Modal from '@salesforce/design-system-react/components/modal';
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

const UserCard = ({
  user,
  removeUser,
}: {
  user: GitHubUser;
  removeUser: () => void;
}) => (
  <div
    className="slds-size_1-of-1
      slds-large-size_1-of-2
      slds-p-around_x-small"
  >
    <Card
      bodyClassName="slds-card__body_inner"
      className="team-member-card"
      icon={<GitHubUserAvatar user={user} />}
      heading={user.login}
      headerActions={
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
      }
    />
  </div>
);

export const UserCards = ({
  users,
  removeUser,
}: {
  users: GitHubUser[];
  removeUser: (user: GitHubUser) => void;
}) => (
  <div className="slds-grid slds-wrap slds-grid_pull-padded-small">
    {users.map((user) => {
      const doRemoveUser = () => removeUser(user);
      return <UserCard key={user.id} user={user} removeUser={doRemoveUser} />;
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
    <DataTableCell {...props} title={login} className="team-member-grid">
      <GitHubUserAvatar user={item} />
      <span className="team-member-username">{login}</span>
    </DataTableCell>
  );
};
UserTableCell.displayName = DataTableCell.displayName;

export const AssignUsersModal = ({
  allUsers,
  users,
  projectName,
  isOpen,
  onRequestClose,
  setUsers,
}: {
  allUsers: GitHubUser[];
  users: GitHubUser[];
  projectName: string;
  isOpen: boolean;
  onRequestClose: () => void;
  setUsers: (users: GitHubUser[]) => void;
}) => {
  const [selection, setSelection] = useState(users);

  // When selected users change, update row selection
  useEffect(() => {
    setSelection(users);
  }, [users]);

  // When modal is canceled, reset row selection
  const handleClose = () => {
    setSelection(users);
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
    setSelection(users);
  };

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      heading={`${i18n.t('Add or Remove Collaborators for')} ${projectName}`}
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
