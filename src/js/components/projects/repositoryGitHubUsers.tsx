import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Modal from '@salesforce/design-system-react/components/modal';
import classNames from 'classnames';
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

const UserTableCell = ({ item, className, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return 'hello';
  }
  let member = item.login;
  if (item.login && item.login !== member) {
    member = `${member} (${item.login})`;
  }
  return (
    <DataTableCell {...props} title={member} className="team-member-grid">
      <Avatar
        imgAlt={member}
        imgSrc={item.avatar_url}
        title={member}
        size="small"
      />
      <span className="team-member-username">{member}</span>
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
      heading="Add New Member"
      footer={[
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          onClick={onRequestClose}
        />,
        <Button
          key="submit"
          type="submit"
          label={i18n.t('Add Member')}
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
          label={i18n.t('GitHub Username')}
          primaryColumn
          width="240"
        >
          <UserTableCell />
        </DataTableColumn>
        <DataTableColumn label={i18n.t('Full Name')} property="name" />
      </DataTable>
    </Modal>
  );
};
