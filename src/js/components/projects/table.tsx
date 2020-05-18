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
  [key: string]: any;
  item?: Project;
}

const CollaboratorTableCell = ({ item, children }: TableCellProps) => (
  <DataTableCell>{item && children}</DataTableCell>
);
CollaboratorTableCell.displayName = DataTableCell.displayName;

const DetailTableCell = ({
  repositorySlug,
  item,
  //   children,
  ...props
}: TableCellProps & {
  repositorySlug: string;
}) => (
  <DataTableCell {...props}>
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
    <DataTable items={items} id="repo-projects-table" noRowHover fixedLayout>
      <DataTableColumn
        key="details"
        label={i18n.t('Project')}
        property="name"
        width="65%"
        primaryColumn
      >
        <DetailTableCell repositorySlug={repositorySlug} />
      </DataTableColumn>
      <DataTableColumn
        key="status"
        label={i18n.t('Status')}
        property="status"
        width="25%"
        primaryColumn
      >
        {/* <div>project status here...</div> */}
      </DataTableColumn>
      <DataTableColumn
        key="numCollaborators"
        label={
          <Icon
            category="utility"
            name="user"
            size="xx-small"
            className="slds-m-bottom_xx-small"
            containerClassName="slds-m-left_xx-small slds-current-color"
          />
        }
        property="numCollaborators"
        width="6%"
        primaryColumn
      >
        <CollaboratorTableCell />
      </DataTableColumn>
    </DataTable>
  );
};

export default ProjectTable;
