import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import classNames from 'classnames';
import Icon from '@salesforce/design-system-react/components/icon';
import ProgressRing from '@salesforce/design-system-react/components/progress-ring';
import i18n from 'i18next';
import React from 'react';

import ProjectListItem from '@/components/projects/listItem';
import { Project } from '@/store/projects/reducer';
import { PROJECT_STATUSES } from '@/utils/constants';

interface TableCellProps {
  [key: string]: any;
  item?: Project;
}

const StatusTableCell = ({ item, className, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const status = item.status;
  let display, icon;
  switch (status) {
    case PROJECT_STATUSES.PLANNED:
      display = 'Planned';
      icon = <ProgressRing value={0} />;
      break;
    case PROJECT_STATUSES.IN_PROGRESS:
      display = 'In Progress';
      icon = <ProgressRing value={40} flowDirection="fill" theme="active" />;
      break;
    case PROJECT_STATUSES.REVIEW:
      display = 'Review';
      icon = <ProgressRing value={100} />;
      break;
    case PROJECT_STATUSES.MERGED:
      display = 'Merged';
      icon = <ProgressRing value={100} theme="complete" hasIcon />;
  }
  return (
    <DataTableCell
      {...props}
      title={display || status}
      className={classNames(className, 'status-cell', 'complex-cell')}
    >
      {icon}
      <span className="slds-m-left_x-small status-cell-text">
        {display || status}
      </span>
    </DataTableCell>
  );
};
StatusTableCell.displayName = DataTableCell.displayName;

const CollaboratorTableCell = ({
  item,
  className,
  children,
}: TableCellProps) => (
  <DataTableCell
    className={classNames(
      className,
      'project-collaborators-cell',
      'numbers-cell',
      'complex-cell',
    )}
  >
    {item && children}
  </DataTableCell>
);
CollaboratorTableCell.displayName = DataTableCell.displayName;

const DetailTableCell = ({
  repositorySlug,
  item,
  className,
  //   children,
  ...props
}: TableCellProps & {
  repositorySlug: string;
}) => (
  <DataTableCell
    {...props}
    className={classNames(
      className,
      'truncated-cell',
      'project-name-cell',
      'complex-cell',
    )}
  >
    {item && <ProjectListItem repositorySlug={repositorySlug} project={item} />}
  </DataTableCell>
);
DetailTableCell.displayName = DataTableCell.displayName;

const ProjectTable = ({
  projects,
  repositorySlug,
}: {
  projects: Project[];
  repositorySlug: string;
}) => {
  const items = projects.map((project) => ({
    ...project,
    numCollaborators: project.github_users?.length || 0,
  }));
  return (
    <DataTable items={items} id="repo-projects-table" noRowHover>
      <DataTableColumn
        key="details"
        label={i18n.t('Project')}
        property="name"
        width="100%"
        primaryColumn
      >
        <DetailTableCell repositorySlug={repositorySlug} />
      </DataTableColumn>
      <DataTableColumn
        key="status"
        label={i18n.t('Status')}
        property="status"
        width="0"
      >
        <StatusTableCell />
      </DataTableColumn>
      <DataTableColumn
        key="numCollaborators"
        label={
          <Icon
            category="utility"
            name="user"
            size="xx-small"
            className="slds-m-bottom_xx-small"
            containerClassName="slds-current-color"
          />
        }
        property="numCollaborators"
        width="0"
      >
        <CollaboratorTableCell />
      </DataTableColumn>
    </DataTable>
  );
};

export default ProjectTable;
