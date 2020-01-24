import Button from '@salesforce/design-system-react/components/button';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import ProgressRing from '@salesforce/design-system-react/components/progress-ring';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { GitHubUserAvatar } from '@/components/user/githubUser';
import { GitHubUser } from '@/store/repositories/reducer';
import { Task } from '@/store/tasks/reducer';
import { ORG_TYPES, OrgTypes, TASK_STATUSES } from '@/utils/constants';
import routes from '@/utils/routes';

interface TableCellProps {
  [key: string]: any;
  item?: Task;
  type?: OrgTypes;
  repositorySlug?: string;
  projectSlug?: string;
}

interface Props {
  repositorySlug: string;
  projectSlug: string;
  tasks: Task[];
}

const NameTableCell = ({
  repositorySlug,
  projectSlug,
  item,
  children,
  ...props
}: TableCellProps) => (
  <DataTableCell {...props}>
    {repositorySlug && projectSlug && item && (
      <Link to={routes.task_detail(repositorySlug, projectSlug, item.slug)}>
        {children}
      </Link>
    )}
  </DataTableCell>
);
NameTableCell.displayName = DataTableCell.displayName;

const StatusTableCell = ({ item, className, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  let displayStatus, icon;
  switch (item.status) {
    case TASK_STATUSES.PLANNED:
      displayStatus = i18n.t('Planned');
      icon = <ProgressRing value={0} />;
      break;
    case TASK_STATUSES.IN_PROGRESS:
      displayStatus = i18n.t('In Progress');
      icon = <ProgressRing value={40} flowDirection="fill" theme="active" />;
      break;
    case TASK_STATUSES.COMPLETED:
      displayStatus = i18n.t('Complete');
      icon = <ProgressRing value={100} theme="complete" hasIcon />;
      break;
  }
  return (
    <DataTableCell
      {...props}
      title={displayStatus || item.status}
      className={classNames(className, 'project-task-status')}
    >
      {icon}
      <span className="slds-m-left_x-small project-task-status-text">
        {displayStatus || item.status}
      </span>
    </DataTableCell>
  );
};
StatusTableCell.displayName = DataTableCell.displayName;

const AssigneeTableCell = ({
  type,
  children,
  ...props
}: TableCellProps & { children?: GitHubUser | null }) => {
  let title;
  switch (type) {
    case ORG_TYPES.DEV:
      title = i18n.t('Assign Developer');
      break;
    case ORG_TYPES.QA:
      title = i18n.t('Assign Reviewer');
      break;
  }
  const contents = children ? (
    <GitHubUserAvatar user={children} />
  ) : (
    <Button
      className="slds-m-left_xx-small"
      assistiveText={{ icon: title }}
      iconCategory="utility"
      iconName="adduser"
      iconSize="medium"
      variant="icon"
      title={title}
    />
  );
  return <DataTableCell {...props}>{contents}</DataTableCell>;
};
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
        <NameTableCell
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
        key="assigned_dev"
        label={i18n.t('Developer')}
        property="assigned_dev"
        width="15%"
      >
        <AssigneeTableCell type={ORG_TYPES.DEV} />
      </DataTableColumn>
      <DataTableColumn
        key="assigned_qa"
        label={i18n.t('Reviewer')}
        property="assigned_qa"
        width="15%"
      >
        <AssigneeTableCell type={ORG_TYPES.QA} />
      </DataTableColumn>
    </DataTable>
  ) : null;

export default TaskTable;
