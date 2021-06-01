import Card from '@salesforce/design-system-react/components/card';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { ReactNode, useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';

import AssignTaskRoleModal from '~js/components/githubUsers/assignTaskRole';
import { UserCard } from '~js/components/githubUsers/cards';
import Footer from '~js/components/orgs/cards/footer';
import OrgActions from '~js/components/orgs/cards/orgActions';
import OrgIcon from '~js/components/orgs/cards/orgIcon';
import OrgInfo from '~js/components/orgs/cards/orgInfo';
import OrgSpinner from '~js/components/orgs/cards/orgSpinner';
import RefreshOrgModal from '~js/components/orgs/cards/refresh';
import UserActions from '~js/components/orgs/cards/userActions';
import { AssignedUserTracker } from '~js/components/orgs/taskOrgCards';
import TourPopover from '~js/components/tour/popover';
import { AppState } from '~js/store';
import { Org } from '~js/store/orgs/reducer';
import { selectProjectCollaborator } from '~js/store/projects/selectors';
import { Task } from '~js/store/tasks/reducer';
import { GitHubUser, User } from '~js/store/user/reducer';
import { ORG_TYPES, OrgTypes } from '~js/utils/constants';
import { getTaskCommits } from '~js/utils/helpers';
import { logError } from '~js/utils/logging';

interface TaskOrgCardProps {
  org: Org | null;
  type: 'Dev' | 'QA';
  user: User;
  task: Task;
  projectId: string;
  userHasPermissions: boolean;
  epicUsers: GitHubUser[];
  githubUsers: GitHubUser[];
  epicCreatingBranch: boolean;
  epicUrl: string;
  repoUrl: string;
  isCreatingOrg: boolean;
  isDeletingOrg: boolean;
  isRefreshingUsers: boolean;
  isConvertingOrg?: boolean;
  assignUserModalOpen: OrgTypes | null;
  openAssignUserModal: (type: OrgTypes) => void;
  closeAssignUserModal: () => void;
  handleAssignUser: ({
    type,
    assignee,
    shouldAlertAssignee,
  }: AssignedUserTracker) => void;
  handleCreate: (type: OrgTypes) => void;
  handleDelete: (org: Org) => void;
  handleCheckForOrgChanges: (org: Org) => void;
  handleRefresh?: (org: Org) => void;
  openCaptureModal?: () => void;
  openSubmitReviewModal?: () => void;
  testOrgReadyForReview?: boolean;
  testOrgSubmittingReview?: boolean;
}

const TaskOrgCard = ({
  org,
  type,
  user,
  task,
  projectId,
  userHasPermissions,
  epicUsers,
  githubUsers,
  epicCreatingBranch,
  repoUrl,
  isCreatingOrg,
  isDeletingOrg,
  isRefreshingUsers,
  isConvertingOrg,
  assignUserModalOpen,
  openAssignUserModal,
  closeAssignUserModal,
  handleAssignUser,
  handleCreate,
  handleDelete,
  handleCheckForOrgChanges,
  handleRefresh,
  openCaptureModal,
  openSubmitReviewModal,
  testOrgReadyForReview,
  testOrgSubmittingReview,
}: TaskOrgCardProps) => {
  let assignedUserId: string | null = null;
  let heading, orgHeading;
  let popover: ReactNode = null;
  switch (type) {
    case ORG_TYPES.QA:
      assignedUserId = task.assigned_qa;
      heading = i18n.t('Tester');
      orgHeading = i18n.t('Test Org');
      popover = (
        <TourPopover
          align="top left"
          heading={i18n.t('Tester & Test Org')}
          body={
            <Trans i18nKey="tourTaskTestOrg">
              Assign yourself or someone else as Tester on this Task. Testers
              create a Test Org to view the Developer’s work, and then approve
              the work or request changes that must be addressed before the Task
              can be completed. Use the drop down menu to change or remove the
              Tester.
            </Trans>
          }
        />
      );
      break;
    case ORG_TYPES.DEV:
      assignedUserId = task.assigned_dev;
      heading =
        !userHasPermissions && !assignedUserId
          ? i18n.t('No Developer')
          : i18n.t('Developer');
      orgHeading = i18n.t('Dev Org');
      popover = (
        <TourPopover
          align="top left"
          heading={i18n.t('Developer & Dev Org')}
          body={
            <Trans i18nKey="tourTaskDevOrg">
              A Developer is the person assigned to do the work of a Task.
              Developers create Dev Orgs for their work, retrieve their changes,
              and then submit their work for someone to test. Assign yourself or
              another Collaborator as the Developer on this Task. Use the drop
              down menu to change or remove the Developer.
            </Trans>
          }
        />
      );
      break;
  }
  const assignedUser = useSelector((state: AppState) =>
    selectProjectCollaborator(state, projectId, assignedUserId),
  );
  const assignedToCurrentUser = user.github_id === assignedUserId;
  const ownedByCurrentUser = Boolean(org?.is_created && user.id === org?.owner);
  const ownedByWrongUser =
    org?.is_created && org.owner_gh_id !== assignedUserId ? org : null;
  const isCreating = Boolean(isCreatingOrg || (org && !org.is_created));
  const isDeleting = Boolean(isDeletingOrg || org?.delete_queued_at);
  const isRefreshingChanges = Boolean(org?.currently_refreshing_changes);
  const isRefreshingOrg = Boolean(org?.currently_refreshing_org);
  const isReassigningOrg = Boolean(org?.currently_reassigning_user);

  // If (somehow) there's an org owned by someone else, do not show org.
  if (ownedByWrongUser) {
    logError(
      'A scratch org exists for this task, but is not owned by the assigned user.',
      {
        org,
        assignedUser,
      },
    );
    // eslint-disable-next-line no-param-reassign
    org = null;
  }

  // refresh org modal
  const [refreshOrgModalOpen, setRefreshOrgModalOpen] = useState(false);
  const openRefreshOrgModal = () => {
    setRefreshOrgModalOpen(true);
  };
  const closeRefreshOrgModal = () => {
    setRefreshOrgModalOpen(false);
  };

  const doAssignUser = useCallback(
    (assignee: string | null, shouldAlertAssignee: boolean) => {
      handleAssignUser({ type, assignee, shouldAlertAssignee });
    },
    [handleAssignUser, type],
  );
  const doRefreshOrg = useCallback(() => {
    /* istanbul ignore else */
    if (org && org.org_type === ORG_TYPES.QA) {
      handleRefresh?.(org);
    }
  }, [handleRefresh, org]);
  const doCreateOrg = useCallback(() => {
    handleCreate(type);
  }, [handleCreate, type]);
  const doDeleteOrg = useCallback(() => {
    const orgToDelete = org || ownedByWrongUser;
    /* istanbul ignore else */
    if (orgToDelete) {
      handleDelete(orgToDelete);
    }
  }, [handleDelete, org, ownedByWrongUser]);
  const doCheckForOrgChanges = useCallback(() => {
    /* istanbul ignore else */
    if (org) {
      handleCheckForOrgChanges(org);
    }
  }, [handleCheckForOrgChanges, org]);

  const taskCommits = getTaskCommits(task);
  const orgCommitIdx = org ? taskCommits.indexOf(org.latest_commit) : -1;
  // We consider an org out-of-date if it is not based on the first commit.
  const testOrgOutOfDate = Boolean(
    type === ORG_TYPES.QA && org && orgCommitIdx !== 0,
  );

  return (
    <div
      className="slds-size_1-of-1
        slds-large-size_1-of-2
        slds-p-around_x-small
        slds-is-relative
        org-card"
    >
      {popover}
      <Card
        className={classNames({ 'has-nested-card': assignedUser })}
        bodyClassName="slds-card__body_inner"
        heading={heading}
        headerActions={
          userHasPermissions ||
          type === ORG_TYPES.QA ||
          (assignedUserId && assignedUserId === user.github_id) ? (
            <UserActions
              type={type}
              assignedUserId={assignedUserId}
              currentUserId={user.github_id}
              userHasPermissions={userHasPermissions}
              openAssignUserModal={openAssignUserModal}
              setUser={doAssignUser}
            />
          ) : null
        }
        footer={
          <Footer
            org={org}
            ownedByCurrentUser={ownedByCurrentUser}
            isCreating={isCreating}
            isDeleting={isDeleting}
            isRefreshingChanges={isRefreshingChanges}
            isReassigningOrg={isReassigningOrg}
            isRefreshingOrg={isRefreshingOrg}
            testOrgOutOfDate={testOrgOutOfDate}
            readyForReview={testOrgReadyForReview}
            openRefreshOrgModal={openRefreshOrgModal}
          />
        }
      >
        {assignedUser && (
          <div className="slds-m-bottom_small">
            <UserCard user={assignedUser} className="nested-card" />
          </div>
        )}
        {(assignedUser || ownedByWrongUser || task.review_status) && (
          <>
            <hr className="slds-m-vertical_none" />
            <Card
              className="nested-card wrap-inner-truncate"
              heading={orgHeading}
              icon={
                org &&
                !isCreating && (
                  <OrgIcon
                    orgId={org.id}
                    ownedByCurrentUser={ownedByCurrentUser}
                    isDeleting={isDeleting}
                    isRefreshingOrg={isRefreshingOrg}
                    testOrgOutOfDate={testOrgOutOfDate}
                    openRefreshOrgModal={openRefreshOrgModal}
                  />
                )
              }
              headerActions={
                <OrgActions
                  org={org}
                  type={type}
                  task={task}
                  disableCreation={epicCreatingBranch}
                  ownedByCurrentUser={ownedByCurrentUser}
                  assignedToCurrentUser={assignedToCurrentUser}
                  ownedByWrongUser={ownedByWrongUser}
                  orgOutOfDate={testOrgOutOfDate}
                  readyForReview={testOrgReadyForReview}
                  isCreating={isCreating}
                  isDeleting={isDeleting}
                  isRefreshingOrg={isRefreshingOrg}
                  isSubmittingReview={testOrgSubmittingReview}
                  openSubmitReviewModal={openSubmitReviewModal}
                  doCreateOrg={doCreateOrg}
                  doDeleteOrg={doDeleteOrg}
                  doRefreshOrg={doRefreshOrg}
                />
              }
            >
              <OrgInfo
                org={org}
                type={type}
                task={task}
                baseCommit={taskCommits[0]}
                repoUrl={repoUrl}
                ownedByCurrentUser={ownedByCurrentUser}
                ownedByWrongUser={ownedByWrongUser}
                userHasPermissions={userHasPermissions}
                isCreating={isCreating}
                isRefreshingOrg={isRefreshingOrg}
                isSubmittingReview={testOrgSubmittingReview}
                orgOutOfDate={testOrgOutOfDate}
                missingCommits={orgCommitIdx}
                doCheckForOrgChanges={doCheckForOrgChanges}
                openCaptureModal={openCaptureModal}
              />
              <OrgSpinner
                org={org}
                ownedByCurrentUser={ownedByCurrentUser}
                isDeleting={isDeleting}
                isRefreshingChanges={isRefreshingChanges}
                isReassigningOrg={isReassigningOrg}
                isConvertingOrg={isConvertingOrg}
              />
            </Card>
          </>
        )}
      </Card>
      <AssignTaskRoleModal
        projectId={projectId}
        epicUsers={epicUsers}
        githubUsers={githubUsers}
        selectedUser={assignedUser}
        orgType={type}
        isOpen={assignUserModalOpen === type}
        isRefreshingUsers={isRefreshingUsers}
        onRequestClose={closeAssignUserModal}
        setUser={doAssignUser}
      />
      {testOrgOutOfDate && (
        <RefreshOrgModal
          orgUrl={window.api_urls.scratch_org_redirect(org?.id)}
          missingCommits={orgCommitIdx}
          isOpen={refreshOrgModalOpen && !isRefreshingOrg}
          closeRefreshOrgModal={closeRefreshOrgModal}
          doRefreshOrg={doRefreshOrg}
        />
      )}
    </div>
  );
};

export default TaskOrgCard;
