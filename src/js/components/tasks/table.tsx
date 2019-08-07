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
      <span className="slds-align-middle slds-badge">
        {i18n.t('In Progress')}
      </span>
    </DataTableCell>
  );
  StatusTableCell.displayName = DataTableCell.displayName;

  const LinkTableCell = ({ children }: any) => (
    <DataTableCell title="new">
      <Link to="#">{children}</Link>
    </DataTableCell>
  );
  LinkTableCell.displayName = DataTableCell.displayName;
  const columns = [
    <DataTableColumn key="task" label={i18n.t('Task')} property="name">
      <LinkTableCell />
    </DataTableColumn>,
    <DataTableColumn key="status" label={i18n.t('Status')} property="status">
      <StatusTableCell />
    </DataTableColumn>,
    <DataTableColumn
      key="assignee"
      label={i18n.t('Assigned')}
      property="assignee"
    />,
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
