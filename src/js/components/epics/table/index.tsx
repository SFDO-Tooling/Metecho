import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import CollaboratorTableCell from '@/js/components/epics/table/collaboratorCell';
import DetailTableCell from '@/js/components/epics/table/detailCell';
import StatusTableCell from '@/js/components/epics/table/statusCell';
import TourPopover from '@/js/components/tour/popover';
import { Epic } from '@/js/store/epics/reducer';

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
    <DataTable
      items={items}
      id="project-epics-table"
      noRowHover
      className="slds-is-relative outdented_medium"
    >
      <DataTableColumn
        key="details"
        label={
          <>
            {i18n.t('Epic')}
            <TourPopover
              id="tour-epic-name-column"
              align="top left"
              heading={i18n.t('Epic names')}
              body={
                <Trans i18nKey="tourEpicNameColumn">
                  An Epic’s name describes a group of related Tasks. Select an
                  Epic to see its Tasks and Collaborators. To view the Epic on
                  GitHub, select the branch link. A “branch” is a way to create
                  a new feature or make a modification to existing software,
                  without impacting the main “trunk” of the Project.
                </Trans>
              }
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
              id="tour-epic-status-column"
              align="top"
              heading={i18n.t('Epic statuses')}
              body={
                <Trans i18nKey="tourEpicStatusColumn">
                  An Epic begins with a <b>Planned</b> status. The status
                  changes to <b>In Progress</b> when a Developer creates a Dev
                  Org for any Task in the Epic. When all the Epic’s Tasks are
                  complete — meaning all the Task branches have been merged on
                  GitHub — the Epic status changes to <b>Review</b>. The Epic
                  status changes to <b>Merged</b> when the Epic branch has been
                  merged into the Project on GitHub.
                </Trans>
              }
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
              id="tour-epic-collaborators-column"
              align="top"
              heading={i18n.t('Epic Collaborators')}
              body={
                <Trans i18nKey="tourEpicCollaboratorsColumn">
                  The Collaborators column shows the number of people working on
                  the Epic. Anyone with permission to view the Project on GitHub
                  can be assigned as an Epic Collaborator.
                </Trans>
              }
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
