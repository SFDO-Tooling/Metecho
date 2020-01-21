import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useState } from 'react';

import { GitHubUser } from '@/store/repositories/reducer';

interface TableCellProps {
  [key: string]: any;
  item?: GitHubUser;
}

const UserCard = ({
  user,
  removeUser,
}: {
  user: GitHubUser;
  removeUser: (user: GitHubUser) => void;
}) => (
  <div
    className="slds-col slds-size_1-of-1
  slds-large-size_1-of-2 slds-p-around_x-small card-col"
  >
    <Card
      className="team-member-card"
      icon={<Avatar imgSrc={user.avatar_url} size="small" />}
      heading={user.login}
      headerActions={
        <Button
          assistiveText={{ icon: 'Remove' }}
          iconCategory="utility"
          iconName="close"
          iconSize="small"
          iconVariant="border-filled"
          variant="icon"
          onClick={() => removeUser(user)}
        />
      }
    />
  </div>
);

export const AssignedUserCards = ({
  users,
  removeUser,
}: {
  users: GitHubUser[];
  removeUser: (user: GitHubUser) => void;
}) => (
  <div className="slds-grid slds-wrap slds-grid_pull-padded-small">
    {users.map((user) => (
      <UserCard key={user.id} user={user} removeUser={removeUser} />
    ))}
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
      <Avatar
        imgAlt={login}
        imgSrc={item.avatar_url}
        title={login}
        size="small"
      />
      <span className="team-member-username">{login}</span>
    </DataTableCell>
  );
};
UserTableCell.displayName = DataTableCell.displayName;

export const AvailableUserCards = ({
  allUsers,
  users,
  isOpen,
  onRequestClose,
  setUsers,
}: {
  allUsers: GitHubUser[];
  users: GitHubUser[];
  isOpen: boolean;
  onRequestClose: () => void;
  setUsers: (users: GitHubUser[]) => void;
}) => {
  const [selection, setSelection] = useState(users);
  const updateSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
    data: { selection: GitHubUser[] },
  ) => {
    setSelection(data.selection);
  };
  const handleSubmit = () => setUsers(selection);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      heading={i18n.t('Add or Remove People to This Project')}
      footer={[
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          onClick={onRequestClose}
        />,
        <Button
          key="submit"
          type="submit"
          label={i18n.t('Save')}
          variant="brand"
          onClick={handleSubmit}
        />,
      ]}
    >
      <DataTable
        items={allUsers}
        selectRows="checkbox"
        selection={selection}
        onRowChange={updateSelection}
      >
        <DataTableColumn label={i18n.t('GitHub Username')} primaryColumn>
          <UserTableCell />
        </DataTableColumn>
      </DataTable>
    </Modal>
  );
};
