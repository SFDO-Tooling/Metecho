import Button from '@salesforce/design-system-react/components/button';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import ProgressRing from '@salesforce/design-system-react/components/progress-ring';
import classNames from 'classnames';
import i18n from 'i18next';
import { sortBy } from 'lodash';
import React, { ReactNode, useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import AssignTaskRoleModal from '~js/components/githubUsers/assignTaskRole';
import GitHubUserAvatar from '~js/components/githubUsers/avatar';
import TourPopover from '~js/components/tour/popover';
import { AppState } from '~js/store';
import { selectProjectCollaborator } from '~js/store/projects/selectors';
import { Task } from '~js/store/tasks/reducer';
import { GitHubUser, User } from '~js/store/user/reducer';
import { selectUserState } from '~js/store/user/selectors';
import {
  ORG_TYPES,
  OrgTypes,
  REVIEW_STATUSES,
  TASK_STATUSES,
} from '~js/utils/constants';
import routes from '~js/utils/routes';

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
  epicSlug: string;
  tasks: Task[];
  epicUsers: GitHubUser[];
  githubUsers: GitHubUser[];
  canAssign: boolean;
  isRefreshingUsers: boolean;
  assignUserAction: AssignUserAction;
}

const NameTableCell = ({
  projectSlug,
  epicSlug,
  item,
  className,
  children,
  ...props
}: TableCellProps & {
  projectSlug: string;
  epicSlug: string;
}) => (
  <DataTableCell
    {...props}
    className={classNames(className, 'epic-task-name', 'truncated-cell')}
  >
    {projectSlug && epicSlug && item && (
      <Link to={routes.task_detail(projectSlug, epicSlug, item.slug)}>
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
  const status =
    item.review_valid && item.status === TASK_STATUSES.IN_PROGRESS
      ? item.review_status
      : item.status;
  let displayStatus, icon;
  switch (status) {
    case TASK_STATUSES.PLANNED:
      displayStatus = i18n.t('Planned');
      icon = <ProgressRing value={0} />;
      break;
    case TASK_STATUSES.IN_PROGRESS:
      if (item.pr_is_open) {
        displayStatus = i18n.t('Test');
        icon = <ProgressRing value={60} flowDirection="fill" theme="active" />;
      } else {
        displayStatus = i18n.t('In Progress');
        icon = <ProgressRing value={40} flowDirection="fill" theme="active" />;
      }
      break;
    case TASK_STATUSES.COMPLETED:
      displayStatus = i18n.t('Complete');
      icon = <ProgressRing value={100} theme="complete" hasIcon />;
      break;
    case TASK_STATUSES.CANCELED:
      displayStatus = i18n.t('Canceled');
      icon = (
        <ProgressRing
          value={0}
          hasIcon
          icon={<Icon category="utility" name="close" />}
        />
      );
      break;
    case REVIEW_STATUSES.CHANGES_REQUESTED:
      displayStatus = i18n.t('Changes Requested');
      icon = (
        <ProgressRing value={60} flowDirection="fill" theme="warning" hasIcon />
      );
      break;
    case REVIEW_STATUSES.APPROVED:
      displayStatus = i18n.t('Approved');
      icon = <ProgressRing value={80} flowDirection="fill" />;
      break;
  }
  return (
    <DataTableCell
      {...props}
      title={displayStatus || status}
      className={classNames(className, 'epic-task-status', 'status-cell')}
    >
      {icon}
      <span className="slds-m-left_x-small status-cell-text">
        {displayStatus || status}
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
  epicUsers: GitHubUser[];
  githubUsers: GitHubUser[];
  currentUser?: User;
  canAssign: boolean;
  isRefreshingUsers: boolean;
  assignUserAction: AssignUserAction;
  children?: string | null;
}) => {
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
        title = i18n.t('Assign Developer');
        break;
      case ORG_TYPES.QA:
        title = i18n.t('Assign Tester');
        break;
    }

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
          epicUsers={epicUsers}
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
    title = i18n.t('Self-Assign as Tester');
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
    <DataTableCell
      {...props}
      title={title}
      className={classNames(className, 'epic-task-assignee')}
    >
      {contents}
    </DataTableCell>
  );
};
AssigneeTableCell.displayName = DataTableCell.displayName;

const TaskTable = ({
  projectId,
  projectSlug,
  epicSlug,
  tasks,
  epicUsers,
  githubUsers,
  canAssign,
  isRefreshingUsers,
  assignUserAction,
}: Props) => {
  const currentUser = useSelector(selectUserState) as User;
  const statusOrder = {
    [TASK_STATUSES.IN_PROGRESS]: 1,
    [TASK_STATUSES.PLANNED]: 2,
    [TASK_STATUSES.COMPLETED]: 3,
    [TASK_STATUSES.CANCELED]: 4,
  };
  const taskDefaultSort = sortBy(tasks, [
    (item) => statusOrder[item.status],
    'name',
  ]);
  return (
    <DataTable items={taskDefaultSort} id="epic-tasks-table" noRowHover>
      <DataTableColumn
        key="name"
        label={
          <>
            {i18n.t('Task')}
            <TourPopover
              align="top left"
              heading={i18n.t('Task names')}
              body={
                <Trans i18nKey="tourTaskNameColumn">
                  A Task’s name describes the work being done. Select a name to
                  access the Dev and Tester Orgs for the Task, as well as
                  specific details about the work that has been done.
                </Trans>
              }
            />
          </>
        }
        property="name"
        width="65%"
        primaryColumn
      >
        <NameTableCell projectSlug={projectSlug} epicSlug={epicSlug} />
      </DataTableColumn>
      <DataTableColumn
        key="status"
        label={
          <>
            {i18n.t('Status')}
            <TourPopover
              align="top"
              heading={i18n.t('Task statuses')}
              body={
                <Trans i18nKey="tourTaskStatusColumn">
                  A Task begins with a status of <b>Planned</b>. When a Dev Org
                  is created, the status changes to <b>In Progress</b>, and the
                  Developer begins work. When the Developer is ready for the
                  work to be tested, the status becomes <b>Test</b>. After
                  Testing, the status becomes either <b>Changes Requested</b> or{' '}
                  <b>Approved</b> based on the Tester’s review. If the Developer
                  retrieves new changes, the status moves back to{' '}
                  <b>In Progress</b>. Once the Task is added to the Project on
                  GitHub, the status is <b>Complete</b>.
                </Trans>
              }
            />
          </>
        }
        property="status"
        width="20%"
      >
        <StatusTableCell />
      </DataTableColumn>
      <DataTableColumn
        key="assigned_dev"
        label={
          <>
            {i18n.t('Developer')}
            <TourPopover
              align="top"
              heading={i18n.t('Task Developers')}
              body={
                <Trans i18nKey="tourTaskDeveloperColumn">
                  A <b>Developer</b> is the person assigned to do the work of a
                  Task. Developers create Dev Orgs for their work, retrieve
                  their changes, and then submit their work for someone to test.
                  Anyone with permission to contribute to the project on GitHub
                  can be assigned as a Developer on a Task.
                </Trans>
              }
            />
          </>
        }
        property="assigned_dev"
        width="15%"
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
          <>
            {i18n.t('Tester')}
            <TourPopover
              align="top"
              heading={i18n.t('Task Testers')}
              body={
                <Trans i18nKey="tourTaskTesterColumn">
                  Assign yourself or someone else as a <b>Tester</b> to help on
                  a Task for this Project. When a Task has a status of “Test,”
                  it is ready for testing. Testers create a Test Org to view the
                  Developer’s work, and approve the work or request changes
                  before the Task can be Completed.
                </Trans>
              }
            />
          </>
        }
        property="assigned_qa"
        width="15%"
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
  );
};

export default TaskTable;
