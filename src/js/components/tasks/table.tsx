import React from 'react';

import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import { TaskState } from '@/store/tasks/reducer';

export interface Props {
  tasks: TaskState;
}

const TaskTable: React.SFC<Props> = ({ tasks }) => {
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
    <>
      {tasks.length ? (
        <DataTable items={tasks} id="DataTableExample-1-default">
          {columns}
        </DataTable>
      ) : null}{' '}
    </>
  );
};

export default TaskTable;
