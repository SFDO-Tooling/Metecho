import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useState } from 'react';

import { GitHubUser } from '@/store/repositories/reducer';

const UserCard = ({
  user,
  removeUser,
}: {
  user: GitHubUser;
  removeUser: (user: GitHubUser) => void;
}) => (
  <div
    className="slds-size_1-of-1
      slds-large-size_1-of-2
      slds-p-around_x-small"
  >
    <Card
      bodyClassName="slds-card__body_inner"
      icon={<Avatar imgSrc={user.avatar_url} size="x-small" />}
      heading={user.login}
      headerActions={<Button label="Remove" onClick={() => removeUser(user)} />}
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
  <ul>
    {users.map((user) => (
      <UserCard key={user.id} user={user} removeUser={removeUser} />
    ))}
  </ul>
);

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
      heading="Available users"
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
        <DataTableColumn
          label="GitHub Username"
          property="login"
          primaryColumn
        />
      </DataTable>
    </Modal>
  );
};
