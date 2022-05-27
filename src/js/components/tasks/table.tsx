import Button from '@salesforce/design-system-react/components/button';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import classNames from 'classnames';
import { orderBy } from 'lodash';
import React, { ReactNode, useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { EmptyIllustration } from '@/js/components/404';
import AssignTaskRoleModal from '@/js/components/githubUsers/assignTaskRole';
import GitHubUserAvatar from '@/js/components/githubUsers/avatar';
import TourPopover from '@/js/components/tour/popover';
import {
  getTaskStatus,
  LabelWithSpinner,
  SpinnerWrapper,
  useIsMounted,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { AppState } from '@/js/store';
import { fetchObjects, ObjectFilters } from '@/js/store/actions';
import { selectProjectCollaborator } from '@/js/store/projects/selectors';
import { Task } from '@/js/store/tasks/reducer';
import { GitHubUser, User } from '@/js/store/user/reducer';
import { selectUserState } from '@/js/store/user/selectors';
import {
  OBJECT_TYPES,
  ORG_TYPES,
  OrgTypes,
  TASK_STATUSES,
} from '@/js/utils/constants';
import routes from '@/js/utils/routes';

type AssignUserAction = ({
  task,
  type,
  assignee,
  shouldAlertAssignee,
}: {
  task: Task;
  type: OrgTypes;
  assignee: string | null;
  shouldAlertAssignee: boolean;
}) => void;

interface TableCellProps {
  [key: string]: any;
  className?: string;
  children?: ReactNode;
  item?: Task;
}

interface Props {
  projectId: string;
  projectSlug: string;
  tasks: Task[];
  next?: string | null;
  count?: number;
  isFetched: boolean;
  epicId?: string;
  epicUsers?: GitHubUser[];
  githubUsers: GitHubUser[];
  canAssign: boolean;
  isRefreshingUsers: boolean;
  assignUserAction: AssignUserAction;
  viewEpicsColumn?: boolean;
}

const NameTableCell = ({
  projectSlug,
  item,
  className,
  children,
  ...props
}: TableCellProps & {
  projectSlug: string;
}) => (
  <DataTableCell {...props} className={classNames(className, 'truncated-cell')}>
    {projectSlug && item && (
      <Link
        to={
          item.epic
            ? routes.epic_task_detail(projectSlug, item.epic.slug, item.slug)
            : routes.project_task_detail(projectSlug, item.slug)
        }
      >
        {children}
      </Link>
    )}
  </DataTableCell>
);
NameTableCell.displayName = DataTableCell.displayName;

const EpicTableCell = ({
  projectSlug,
  item,
  className,
  ...props
}: TableCellProps & {
  projectSlug: string;
}) => (
  <DataTableCell {...props} className={classNames(className, 'truncated-cell')}>
    {item?.epic?.slug && item?.epic?.name && projectSlug ? (
      <Link to={routes.epic_detail(projectSlug, item.epic.slug)}>
        {item.epic.name}
      </Link>
    ) : (
      '-'
    )}
  </DataTableCell>
);
EpicTableCell.displayName = DataTableCell.displayName;

const StatusTableCell = ({ item, className, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }

  const { status, icon } = getTaskStatus({
    taskStatus: item.status,
    reviewStatus: item.review_status,
    reviewValid: item.review_valid,
    prIsOpen: item.pr_is_open,
  });

  return (
    <DataTableCell
      {...props}
      title={status}
      className={classNames(className, 'status-cell truncated-cell')}
    >
      <span className="status-cell-icon">{icon}</span>
      <span className="slds-m-left_x-small status-cell-text slds-truncate">
        {status}
      </span>
    </DataTableCell>
  );
};
StatusTableCell.displayName = DataTableCell.displayName;

const AssigneeTableCell = ({
  type,
  projectId,
  epicUsers,
  githubUsers,
  currentUser,
  canAssign,
  isRefreshingUsers,
  assignUserAction,
  item,
  className,
  children,
  ...props
}: TableCellProps & {
  type: OrgTypes;
  projectId: string;
  epicUsers?: GitHubUser[];
  githubUsers: GitHubUser[];
  currentUser?: User;
  canAssign: boolean;
  isRefreshingUsers: boolean;
  assignUserAction: AssignUserAction;
  children?: string | null;
}) => {
  const { t } = useTranslation();
  const assignedUser = useSelector((state: AppState) =>
    selectProjectCollaborator(state, projectId, children),
  );
  const [assignUserModalOpen, setAssignUserModalOpen] = useState(false);

  const openAssignUserModal = () => {
    setAssignUserModalOpen(true);
  };
  const closeAssignUserModal = () => {
    setAssignUserModalOpen(false);
  };

  const doAssignUserAction = useCallback(
    (assignee: string | null, shouldAlertAssignee: boolean) => {
      /* istanbul ignore if */
      if (!item || !type) {
        return;
      }
      assignUserAction({ task: item, type, assignee, shouldAlertAssignee });
    },
    [assignUserAction, item, type],
  );

  const doSelfAssignUserAction = useCallback(() => {
    /* istanbul ignore if */
    if (!item || !type || !currentUser?.github_id) {
      return;
    }
    assignUserAction({
      task: item,
      type,
      assignee: currentUser.github_id,
      shouldAlertAssignee: false,
    });
  }, [assignUserAction, currentUser?.github_id, item, type]);

  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  let contents, title;
  if (assignedUser) {
    contents = <GitHubUserAvatar user={assignedUser} />;
    title = assignedUser.login;
  } else if (canAssign) {
    switch (type) {
      case ORG_TYPES.DEV:
        title = t('Assign Developer');
        break;
      case ORG_TYPES.QA:
        title = t('Assign Tester');
        break;
    }

    const epicCollaborators = item.epic
      ? epicUsers ||
        githubUsers.filter((user) => item.epic?.github_users.includes(user.id))
      : null;

    contents = (
      <>
        <Button
          className="slds-m-left_xx-small"
          assistiveText={{ icon: title }}
          iconCategory="utility"
          iconName="adduser"
          iconSize="medium"
          variant="icon"
          title={title}
          onClick={openAssignUserModal}
        />
        <AssignTaskRoleModal
          projectId={projectId}
          taskHasEpic={Boolean(item.epic)}
          epicUsers={epicCollaborators}
          githubUsers={githubUsers}
          selectedUser={assignedUser || null}
          orgType={type}
          isOpen={assignUserModalOpen}
          isRefreshingUsers={isRefreshingUsers}
          onRequestClose={closeAssignUserModal}
          setUser={doAssignUserAction}
        />
      </>
    );
  } else if (type === ORG_TYPES.QA && currentUser?.github_id) {
    title = t('Self-Assign as Tester');
    contents = (
      <Button
        className="slds-m-left_xx-small"
        assistiveText={{ icon: title }}
        iconCategory="utility"
        iconName="adduser"
        iconSize="medium"
        variant="icon"
        title={title}
        onClick={doSelfAssignUserAction}
      />
    );
  }
  return (
    <DataTableCell {...props} title={title} className={className}>
      {contents}
    </DataTableCell>
  );
};
AssigneeTableCell.displayName = DataTableCell.displayName;

const TaskTable = ({
  projectId,
  projectSlug,
  tasks,
  next,
  count,
  isFetched,
  epicId,
  epicUsers,
  githubUsers,
  canAssign,
  isRefreshingUsers,
  assignUserAction,
  viewEpicsColumn,
}: Props) => {
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const currentUser = useSelector(selectUserState) as User;
  const [fetchingTasks, setFetchingTasks] = useState(false);

  const statusOrder = {
    [TASK_STATUSES.IN_PROGRESS]: 1,
    [TASK_STATUSES.PLANNED]: 2,
    [TASK_STATUSES.COMPLETED]: 3,
    [TASK_STATUSES.CANCELED]: 4,
  };

  const items = isFetched
    ? orderBy(
        tasks,
        [
          (item) => statusOrder[item.status],
          'created_at',
          (item) => item.name.toLowerCase(),
        ],
        ['asc', 'desc', 'asc'],
      )
    : [];

  const fetchMoreTasks = useCallback(() => {
    /* istanbul ignore else */
    if (isFetched && projectId && next) {
      /* istanbul ignore else */
      if (isMounted.current) {
        setFetchingTasks(true);
      }

      const filters: ObjectFilters = { project: projectId };
      if (epicId) {
        filters.epic = epicId;
      }

      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.TASK,
          filters,
          url: next,
        }),
      ).finally(() => {
        /* istanbul ignore else */
        if (isMounted.current) {
          setFetchingTasks(false);
        }
      });
    }
  }, [isFetched, projectId, next, isMounted, epicId, dispatch]);

  return isFetched ? (
    <>
      {tasks.length ? (
        <>
          <DataTable
            items={items}
            id="epic-tasks-table"
            className={viewEpicsColumn ? 'outdented_medium' : ''}
            noRowHover
          >
            <DataTableColumn
              key="name"
              label={
                <>
                  {t('Task')}
                  <TourPopover
                    id="tour-task-name-column"
                    align="top left"
                    heading={t('Task names')}
                    body={
                      <Trans i18nKey="tourTaskNameColumn">
                        A Task’s name describes the work being done. Select a
                        name to access the Dev and Tester Orgs for the Task, as
                        well as specific details about the work that has been
                        done.
                      </Trans>
                    }
                  />
                </>
              }
              property="name"
              width={viewEpicsColumn ? '40%' : '60%'}
              primaryColumn
            >
              <NameTableCell projectSlug={projectSlug} />
            </DataTableColumn>
            {viewEpicsColumn && (
              <DataTableColumn
                key="epic"
                label={
                  <>
                    {t('Epic')}
                    <TourPopover
                      id="tour-task-epic-name-column"
                      align="top left"
                      heading={t('Epic names')}
                      body={
                        <Trans i18nKey="tourTaskEpicNameColumn">
                          Tasks can be grouped together in an Epic. Select the
                          Epic name to view the Task in the context of its
                          group.
                        </Trans>
                      }
                    />
                  </>
                }
                property="epic"
                width="30%"
              >
                <EpicTableCell projectSlug={projectSlug} />
              </DataTableColumn>
            )}
            <DataTableColumn
              key="status"
              label={
                <div className="tour-task-status-column">
                  {t('Status')}
                  <TourPopover
                    id="tour-task-status-column"
                    align="top"
                    heading={t('Task statuses')}
                    body={
                      <Trans i18nKey="tourTaskStatusColumn">
                        A Task begins with a status of <b>Planned</b>. When a
                        Dev Org is created, the status changes to{' '}
                        <b>In Progress</b>, and the Developer begins work. When
                        the Developer is ready for the work to be tested, the
                        status becomes <b>Test</b>. After Testing, the status
                        becomes either <b>Changes Requested</b> or{' '}
                        <b>Approved</b> based on the Tester’s review. If the
                        Developer retrieves new changes, the status moves back
                        to <b>In Progress</b>. Once the Task is added to the
                        Project on GitHub, the status is <b>Complete</b>.
                      </Trans>
                    }
                  />
                </div>
              }
              property="status"
              width={viewEpicsColumn ? '20%' : '30%'}
            >
              <StatusTableCell />
            </DataTableColumn>
            <DataTableColumn
              key="assigned_dev"
              label={
                <>
                  {t('Dev')}
                  <TourPopover
                    id="tour-task-developer-column"
                    align="top"
                    heading={t('Task Developers')}
                    body={
                      <Trans i18nKey="tourTaskDeveloperColumn">
                        A <b>Developer</b> is the person assigned to do the work
                        of a Task. Developers create Dev Orgs for their work,
                        retrieve their changes, and then submit their work for
                        someone to test. Anyone with permission to contribute to
                        the Project on GitHub can be assigned as a Developer on
                        a Task.
                      </Trans>
                    }
                  />
                </>
              }
              property="assigned_dev"
              width="5%"
            >
              <AssigneeTableCell
                type={ORG_TYPES.DEV}
                projectId={projectId}
                epicUsers={epicUsers}
                githubUsers={githubUsers}
                canAssign={canAssign}
                isRefreshingUsers={isRefreshingUsers}
                assignUserAction={assignUserAction}
              />
            </DataTableColumn>
            <DataTableColumn
              key="assigned_qa"
              label={
                <div className="tour-task-tester-column">
                  {t('Test')}
                  <TourPopover
                    id="tour-task-tester-column"
                    align="top"
                    heading={t('Task Testers')}
                    body={
                      <Trans i18nKey="tourTaskTesterColumn">
                        Assign yourself or someone else as a Tester to help on a
                        Task for this Project. When a Task has a status of{' '}
                        <b>Test</b>, it is ready for testing. Testers create a
                        Test Org to view the Developer’s work, and approve the
                        work or request changes before the Task can be
                        completed.
                      </Trans>
                    }
                  />
                </div>
              }
              property="assigned_qa"
              width="5%"
            >
              <AssigneeTableCell
                type={ORG_TYPES.QA}
                projectId={projectId}
                epicUsers={epicUsers}
                githubUsers={githubUsers}
                currentUser={currentUser}
                canAssign={canAssign}
                isRefreshingUsers={isRefreshingUsers}
                assignUserAction={assignUserAction}
              />
            </DataTableColumn>
          </DataTable>
          {tasks?.length && next && tasks?.length !== count ? (
            <div className="slds-m-top_large">
              <Button
                label={fetchingTasks ? <LabelWithSpinner /> : t('Load More')}
                onClick={fetchMoreTasks}
              />
            </div>
          ) : /* istanbul ignore next */ null}
        </>
      ) : (
        <EmptyIllustration
          heading={t('No Tasks')}
          message={
            <Trans i18nKey="noTasks">
              Tasks in Metecho represent small changes to this Project; each one
              has a Developer and a Tester. Tasks are equivalent to GitHub
              branches. There are no Tasks for this Project.
            </Trans>
          }
        />
      )}
    </>
  ) : (
    // Fetching tasks from API
    <div
      className="slds-is-relative
        slds-m-top_medium
        slds-p-vertical_x-large"
    >
      <SpinnerWrapper />
    </div>
  );
};

export default TaskTable;
