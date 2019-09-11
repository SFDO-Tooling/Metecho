import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { Task } from '@/store/tasks/reducer';
import routes from '@/utils/routes';

interface DataCellProps {
  [key: string]: any;
  item?: Task;
  repositorySlug?: string;
  projectSlug?: string;
}

interface Props {
  repositorySlug: string;
  projectSlug: string;
  tasks: Task[];
}

const NameDataCell = ({
  repositorySlug,
  projectSlug,
  item,
  children,
  ...props
}: DataCellProps) => (
  <DataTableCell {...props}>
    {repositorySlug && projectSlug && item && (
      <Link to={routes.task_detail(repositorySlug, projectSlug, item.slug)}>
        {children}
      </Link>
    )}
  </DataTableCell>
);
NameDataCell.displayName = DataTableCell.displayName;

const StatusTableCell = ({ ...props }: DataCellProps) => (
  <DataTableCell {...props}>{i18n.t('Unchanged')}</DataTableCell>
);
StatusTableCell.displayName = DataTableCell.displayName;

const AssigneeTableCell = ({ ...props }: DataCellProps) => (
  <DataTableCell {...props}>
    <Icon
      title={i18n.t('Assign Team Member')}
      category="utility"
      name="adduser"
      size="x-small"
    />
  </DataTableCell>
);
AssigneeTableCell.displayName = DataTableCell.displayName;

const TaskTable = ({ repositorySlug, projectSlug, tasks }: Props) =>
  tasks.length ? (
    <DataTable items={tasks} id="project-tasks-table" noRowHover>
      <DataTableColumn
        key="name"
        label={i18n.t('Task')}
        property="name"
        width="65%"
        primaryColumn
        truncate
      >
        <NameDataCell
          repositorySlug={repositorySlug}
          projectSlug={projectSlug}
        />
      </DataTableColumn>
      <DataTableColumn
        key="status"
        label={i18n.t('Status')}
        property="status"
        width="20%"
      >
        <StatusTableCell />
      </DataTableColumn>
      <DataTableColumn
        key="assignee"
        label={i18n.t('Assigned')}
        property="assignee"
        width="15%"
      >
        <AssigneeTableCell />
      </DataTableColumn>
    </DataTable>
  ) : null;

export default TaskTable;
