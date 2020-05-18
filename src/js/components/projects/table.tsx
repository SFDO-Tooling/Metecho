import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
// import ProgressRing from '@salesforce/design-system-react/components/progress-ring';
import i18n from 'i18next';
import React from 'react';

import ProjectListItem from '@/components/projects/listItem';
import { Project } from '@/store/projects/reducer';

interface TableCellProps {
  //   [key: string]: any;
  item?: Project;
}

const DetailTableCell = ({
  repositorySlug,
  item,
  //   children,
  ...props
}: TableCellProps & {
  repositorySlug: string;
}) => (
  <DataTableCell {...props} className="truncated-cell">
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
}) => (
  <DataTable items={projects} id="repo-projects-table" noRowHover fixedLayout>
    <DataTableColumn
      key="name"
      label={i18n.t('Project')}
      property="name"
      width="80"
      primaryColumn
    >
      <DetailTableCell repositorySlug={repositorySlug} />
    </DataTableColumn>
    <DataTableColumn
      key="item"
      label={i18n.t('Status')}
      property="status"
      width="15%"
      primaryColumn
    >
      <div>project status here...</div>
    </DataTableColumn>
    <DataTableColumn
      key="item"
      label={
        <Icon
          category="utility"
          name="user"
          size="xx-small"
          className="slds-m-bottom_xx-small"
          containerClassName="slds-m-left_xx-small slds-current-color"
        />
      }
      property="github_users.avatar_url"
      width="5%"
      primaryColumn
    >
      <div>gh user count</div>
    </DataTableColumn>
  </DataTable>
);

export default ProjectTable;
