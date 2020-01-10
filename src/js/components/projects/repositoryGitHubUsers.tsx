import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import DataTableRowActions from '@salesforce/design-system-react/components/data-table/row-actions';
import Modal from '@salesforce/design-system-react/components/modal';
import React, { useState } from 'react';

// TODO:
// - Insert these in the correct place in the document.
// - The list of Repo users should probably be a modal, and a separate
//   component, compared to the list of Project users, yes?

const UserCard = ({ user }) => (
  <div
    className="slds-size_1-of-1
      slds-large-size_1-of-2
      slds-p-around_x-small"
  >
    <Card
      bodyClassName="slds-card__body_inner"
      icon={<Avatar imgSrc={user.avatar_url} size="x-small" />}
      heading={user.login}
    />
  </div>
);

export const AssignedUserCards = ({ users }) => (
  <ul>
    {users.map((user) => (
      <UserCard user={user} />
    ))}
  </ul>
);

export const AvailableUserCards = ({
  users,
  isOpen,
  onRequestClose,
  setUsers,
}) => {
  const [selection, setSelection] = useState(users.github_users);
  const updateSelection = (event, data) => {
    setSelection(data.selection);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      heading="Available users"
      footer={[
        <Button label="Cancel" onClick={onRequestClose} />,
        <Button
          label="Save"
          variant="brand"
          onClick={() => setUsers(selection)}
        />,
      ]}
    >
      <DataTable
        items={users}
        selectRows="checkbox"
        selection={selection}
        onRowChange={updateSelection}
      >
        <DataTableColumn label="GitHub username" property="login" primaryColumn>
          <DataTableCell />
        </DataTableColumn>
        <DataTableColumn label="Full name" property="login" primaryColumn>
          <DataTableCell />
        </DataTableColumn>
      </DataTable>
    </Modal>
  );
};
