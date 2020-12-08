import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React from 'react';

import CollaboratorTableCell from '@/components/epics/table/collaboratorCell';
import DetailTableCell from '@/components/epics/table/detailCell';
import StatusTableCell from '@/components/epics/table/statusCell';
import { Epic } from '@/store/epics/reducer';

export interface TableCellProps {
  [key: string]: any;
  item?: Epic;
  className?: string;
}

const EpicTable = ({
  epics,
  repositorySlug,
}: {
  epics: Epic[];
  repositorySlug: string;
}) => {
  const items = epics.map((epic) => ({
    ...epic,
    numCollaborators: epic.github_users?.length || 0,
  }));

  return (
    <DataTable items={items} id="repo-epics-table" noRowHover>
      <DataTableColumn
        key="details"
        label={i18n.t('Epic')}
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

export default EpicTable;
