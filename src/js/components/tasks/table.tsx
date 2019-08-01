import React from 'react';

import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';

export interface TaskTableProps {}

const TaskTable: React.SFC<TaskTableProps> = () => {
  const tasks = {
    0: [
      {
        id: '8IKZHZZV80',
        name: 'task 1',
        status: 'new',
        assignee: 'duggiemitchell',
      },
      {
        id: '5GJOOOPWU7',
        name: 'task 2',
        status: 'new',
        assignee: 'stacy',
      },
      {
        id: '8IKZHZZV81',
        name: 'task 3',
        status: 'in progress',
        assignee: 'jonny',
      },
    ],
  };

  const StatusTableCell = () => (
    <DataTableCell title="new">
      <span className="slds-align-middle slds-badge">new</span>
    </DataTableCell>
  );
  StatusTableCell.displayName = DataTableCell.displayName;

  const columns = [
    <DataTableColumn key="task" label="Task" property="name" />,
    <DataTableColumn key="status" label="Status" property="status">
      <StatusTableCell />
    </DataTableColumn>,
    <DataTableColumn key="assignee" label="Assignee" property="assignee" />,
  ];

  return (
    <DataTable items={tasks[0]} id="DataTableExample-1-default">
      {columns}
    </DataTable>
  );
};

export default TaskTable;
