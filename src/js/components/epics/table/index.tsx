import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import { t } from 'i18next';
import { orderBy } from 'lodash';
import React from 'react';
import { Trans } from 'react-i18next';

import { EmptyIllustration } from '@/js/components/404';
import CollaboratorTableCell from '@/js/components/epics/table/collaboratorCell';
import DetailTableCell from '@/js/components/epics/table/detailCell';
import StatusTableCell from '@/js/components/epics/table/statusCell';
import TaskCountTableCell from '@/js/components/epics/table/taskCountCell';
import TourPopover from '@/js/components/tour/popover';
import { SpinnerWrapper } from '@/js/components/utils';
import { Epic } from '@/js/store/epics/reducer';

export interface TableCellProps {
  [key: string]: any;
  item?: Epic;
  className?: string;
}

const EpicTable = ({
  epics,
  isFetched,
  userHasPermissions,
  projectSlug,
}: {
  epics: Epic[];
  isFetched: boolean;
  userHasPermissions: boolean;
  projectSlug: string;
}) => {
  const items = isFetched
    ? orderBy(
        epics.map((epic) => ({
          ...epic,
          numCollaborators: epic.github_users?.length || 0,
        })),
        ['created_at', 'name'],
        ['desc', 'asc'],
      )
    : [];

  return isFetched ? (
    <>
      {epics.length ? (
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
                {t('Epic')}
                <TourPopover
                  id="tour-epic-name-column"
                  align="top left"
                  heading={t('Epic names')}
                  body={
                    <Trans i18nKey="tourEpicNameColumn">
                      An Epic’s name describes a group of related Tasks. Select
                      an Epic to see its Tasks and Collaborators. To view the
                      Epic on GitHub, select the branch link. A “branch” is a
                      way to create a new feature or make a modification to
                      existing software, without impacting the main “trunk” of
                      the Project.
                    </Trans>
                  }
                />
              </>
            }
            property="name"
            width="60%"
            primaryColumn
          >
            <DetailTableCell projectSlug={projectSlug} />
          </DataTableColumn>
          <DataTableColumn
            key="taskCount"
            label={
              <>
                {t('Tasks')}
                <TourPopover
                  id="tour-epic-tasks-column"
                  align="top"
                  heading={t('Epic Tasks')}
                  body={
                    <Trans i18nKey="tourEpicTasksColumn">
                      The Tasks column is a quick way to see how many Tasks are
                      included in an Epic.
                    </Trans>
                  }
                />
              </>
            }
            property="task_count"
            width="5%"
          >
            <TaskCountTableCell />
          </DataTableColumn>
          <DataTableColumn
            key="status"
            label={
              <>
                {t('Status')}
                <TourPopover
                  id="tour-epic-status-column"
                  align="top"
                  heading={t('Epic statuses')}
                  body={
                    <Trans i18nKey="tourEpicStatusColumn">
                      An Epic begins with a <b>Planned</b> status. The status
                      changes to <b>In Progress</b> when a Developer creates a
                      Dev Org for any Task in the Epic. When all the Epic’s
                      Tasks are complete — meaning all the Task branches have
                      been merged on GitHub — the Epic status changes to{' '}
                      <b>Review</b>. The Epic status changes to <b>Merged</b>{' '}
                      when the Epic branch has been merged into the Project on
                      GitHub.
                    </Trans>
                  }
                />
              </>
            }
            property="status"
            width="30%"
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
                  title={t('Collaborators')}
                />
                <TourPopover
                  id="tour-epic-collaborators-column"
                  align="top"
                  heading={t('Epic Collaborators')}
                  body={
                    <Trans i18nKey="tourEpicCollaboratorsColumn">
                      The Collaborators column shows the number of people
                      working on the Epic. Anyone with permission to view the
                      Project on GitHub can be assigned as an Epic Collaborator.
                    </Trans>
                  }
                />
              </>
            }
            property="numCollaborators"
            width="5%"
          >
            <CollaboratorTableCell />
          </DataTableColumn>
        </DataTable>
      ) : (
        <EmptyIllustration
          heading={t('No Epics')}
          message={
            userHasPermissions ? (
              <Trans i18nKey="createEpicHelpText">
                Epics in Metecho are the high-level features that can be broken
                down into smaller parts by creating Tasks. You can create a new
                Epic or create an Epic based on an existing GitHub branch. Every
                Epic requires a unique Epic name, which becomes the branch name
                in GitHub unless you choose to use an existing branch.
              </Trans>
            ) : (
              <Trans i18nKey="noEpics">
                Epics in Metecho are the high-level features that can be broken
                down into smaller parts by creating Tasks. There are no Epics
                for this Project.
              </Trans>
            )
          }
        />
      )}
    </>
  ) : (
    // Fetching epics from API
    <div className="slds-is-relative slds-m-top_medium slds-p-vertical_x-large">
      <SpinnerWrapper />
    </div>
  );
};

export default EpicTable;
