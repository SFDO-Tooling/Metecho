import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import React, { useState } from 'react';
import { GitHubUser } from 'src/js/store/user/reducer';

import { GitHubUserButton } from '../githubUser';

const UserNameDataTableCell = (props: any) => (
  <DataTableCell className="foo-bar" title={props.item.login} {...props}>
    <GitHubUserButton user={props.item} />
  </DataTableCell>
);
UserNameDataTableCell.displayName = DataTableCell.displayName;

const GithubUserTable = ({ users, ...other }: { users: GitHubUser[] }) => {
  const [selection, setSelection] = useState([]);
  const handleRowChange = (event, data) => {
    setSelection(data.selection);
    console.log(event, data);
  };
  return (
    <DataTable
      selectRows="radio"
      items={users}
      id="github-users"
      selection={selection}
      onRowChange={handleRowChange}
    >
      <DataTableColumn
        key="github-username"
        label="Github User"
        property="login"
        className="foo-bar"
      >
        <UserNameDataTableCell
          {...other}
          className="foo-bar"
          handleClick={handleRowChange}
        />
      </DataTableColumn>
      <DataTableColumn
        key="github-fullname"
        label="Full Name"
        property="fullName"
      />
    </DataTable>
  );
};

export default GithubUserTable;
