import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import { sortBy } from 'lodash';
import React from 'react';

import CollaboratorTableCell from '@/components/projects/table/collaboratorCell';
import DetailTableCell from '@/components/projects/table/detailCell';
import StatusTableCell from '@/components/projects/table/statusCell';
import { Project } from '@/store/projects/reducer';
import { PROJECT_STATUSES } from '@/utils/constants';

export interface TableCellProps {
  [key: string]: any;
  item?: Project;
  className?: string;
}

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
  const statusOrder = {
    [PROJECT_STATUSES.REVIEW]: 1,
    [PROJECT_STATUSES.IN_PROGRESS]: 2,
    [PROJECT_STATUSES.PLANNED]: 3,
    [PROJECT_STATUSES.MERGED]: 4,
  };
  const projectDefaultSort = sortBy(items, [
    (item) => statusOrder[item.status],
  ]);

  return (
    <DataTable items={projectDefaultSort} id="repo-projects-table" noRowHover>
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
            title={i18n.t('Collaborators')}
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
