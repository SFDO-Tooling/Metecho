import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React from 'react';

import CollaboratorTableCell from '~js/components/epics/table/collaboratorCell';
import DetailTableCell from '~js/components/epics/table/detailCell';
import StatusTableCell from '~js/components/epics/table/statusCell';
import TourPopover from '~js/components/tour/popover';
import { Epic } from '~js/store/epics/reducer';

export interface TableCellProps {
  [key: string]: any;
  item?: Epic;
  className?: string;
}

const EpicTable = ({
  epics,
  projectSlug,
}: {
  epics: Epic[];
  projectSlug: string;
}) => {
  const items = epics.map((epic) => ({
    ...epic,
    numCollaborators: epic.github_users?.length || 0,
  }));

  return (
    <DataTable items={items} id="project-epics-table" noRowHover>
      <DataTableColumn
        key="details"
        label={
          <>
            {i18n.t('Epic')}
            <TourPopover
              align="right"
              heading={i18n.t('some heading')}
              body={i18n.t('some body text')}
            />
          </>
        }
        property="name"
        width="100%"
        primaryColumn
      >
        <DetailTableCell projectSlug={projectSlug} />
      </DataTableColumn>
      <DataTableColumn
        key="status"
        label={
          <>
            {i18n.t('Status')}
            <TourPopover
              align="right"
              heading={i18n.t('some heading')}
              body={i18n.t('some body text')}
            />
          </>
        }
        property="status"
        width="0"
      >
        <StatusTableCell />
      </DataTableColumn>
      <DataTableColumn
        key="numCollaborators"
        label={
          <>
            <Icon
              category="utility"
              name="user"
              size="xx-small"
              className="slds-m-bottom_xx-small"
              containerClassName="slds-current-color"
              title={i18n.t('Collaborators')}
            />
            <TourPopover
              align="right"
              heading={i18n.t('some heading')}
              body={i18n.t('some body')}
            />
          </>
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
