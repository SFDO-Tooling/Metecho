import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import i18n from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { TaskState } from '@/store/tasks/reducer';

export interface Props {
  tasks: TaskState;
}

const TaskTable: React.SFC<Props> = ({ tasks }: Props) => {
  const StatusTableCell = () => (
    <DataTableCell title="new">
      <span className="slds-align-middle">
        {i18n.t('In Progress')}
      </span>
    </DataTableCell>
  );
  StatusTableCell.displayName = DataTableCell.displayName;

  const LinkTableCell = ({ children }: any) => (
    <DataTableCell title="new" className="slds-p-horizontal_none">
      <Link to="#">{children}</Link>
    </DataTableCell>
  );
  LinkTableCell.displayName = DataTableCell.displayName;
  const columns = [
    <DataTableColumn
      key="task"
      label={i18n.t('Task')}
      property="name"
      width="65%"
    >
      <LinkTableCell />
    </DataTableColumn>,
    <DataTableColumn
      key="status"
      label={i18n.t('Status')}
      property="status"
      width="20%"
    >
      <StatusTableCell />
    </DataTableColumn>,
    <DataTableColumn
      key="assignee"
      label={i18n.t('Assigned')}
      property="assignee"
      width="15%"
    />,
  ];

  return (
    <>
      {tasks.length ? (
        <DataTable
          items={tasks}
          id="DataTableExample-1-default"
          className="minimal-th"
          fixedLayout
          noRowHover
          unbufferedCell
        >
          {columns}
        </DataTable>
      ) : null}{' '}
    </>
  );
};

export default TaskTable;
