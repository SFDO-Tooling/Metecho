import Card from '@salesforce/design-system-react/components/card';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { AssignedUserTracker } from '@/components/tasks/cards';
import Footer from '@/components/tasks/cards/footer';
import OrgActions from '@/components/tasks/cards/orgActions';
import OrgIcon from '@/components/tasks/cards/orgIcon';
import OrgInfo from '@/components/tasks/cards/orgInfo';
import OrgSpinner from '@/components/tasks/cards/orgSpinner';
import RefreshOrgModal from '@/components/tasks/cards/refresh';
import SubmitReviewModal from '@/components/tasks/cards/submitReview';
import UserActions from '@/components/tasks/cards/userActions';
import { AssignUserModal, UserCard } from '@/components/user/githubUser';
import { Org } from '@/store/orgs/reducer';
import { Task } from '@/store/tasks/reducer';
import { GitHubUser, User } from '@/store/user/reducer';
import { addUrlParams } from '@/utils/api';
import {
  ORG_TYPES,
  OrgTypes,
  SHOW_PROJECT_COLLABORATORS,
} from '@/utils/constants';
import { getTaskCommits } from '@/utils/helpers';
import { logError } from '@/utils/logging';

interface OrgCardProps {
  org: Org | null;
  type: OrgTypes;
  user: User;
  task: Task;
  projectUsers: GitHubUser[];
  projectUrl: string;
  repoUrl: string;
  isCreatingOrg: boolean;
  isDeletingOrg: boolean;
  handleAssignUser: ({ type, assignee }: AssignedUserTracker) => void;
  handleCreate: (type: OrgTypes) => void;
  handleDelete: (org: Org) => void;
  handleCheckForOrgChanges: (org: Org) => void;
  handleRefresh?: (org: Org) => void;
  openCaptureModal?: () => void;
}

const OrgCard = ({
  org,
  type,
  user,
  task,
  projectUsers,
  projectUrl,
  repoUrl,
  isCreatingOrg,
  isDeletingOrg,
  handleAssignUser,
  handleCreate,
  handleDelete,
  handleCheckForOrgChanges,
  handleRefresh,
  openCaptureModal,
  history,
}: OrgCardProps & RouteComponentProps) => {
  const assignedUser =
    type === ORG_TYPES.QA ? task.assigned_qa : task.assigned_dev;
  const assignedToCurrentUser = user.username === assignedUser?.login;
  const ownedByCurrentUser = Boolean(org?.is_created && user.id === org?.owner);
  const ownedByWrongUser =
    org?.is_created && org.owner_gh_username !== assignedUser?.login
      ? org
      : null;
  const isCreating = Boolean(isCreatingOrg || (org && !org.is_created));
  const isDeleting = Boolean(isDeletingOrg || org?.delete_queued_at);
  const isRefreshingChanges = Boolean(org?.currently_refreshing_changes);
  const isRefreshingOrg = Boolean(org?.currently_refreshing_org);
  const isSubmittingReview = Boolean(
    type === ORG_TYPES.QA && task.currently_submitting_review,
  );

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

  const [assignUserModalOpen, setAssignUserModalOpen] = useState(false);
  const openAssignUserModal = () => {
    setAssignUserModalOpen(true);
  };
  const closeAssignUserModal = () => {
    setAssignUserModalOpen(false);
  };

  // refresh org modal
  const [refreshOrgModalOpen, setRefreshOrgModalOpen] = useState(false);
  const openRefreshOrgModal = () => {
    setRefreshOrgModalOpen(true);
  };
  const closeRefreshOrgModal = () => {
    setRefreshOrgModalOpen(false);
  };

  const [submitReviewModalOpen, setSubmitReviewModalOpen] = useState(false);
  const openSubmitReviewModal = () => {
    setSubmitReviewModalOpen(true);
  };
  const closeSubmitReviewModal = () => {
    setSubmitReviewModalOpen(false);
  };

  const doAssignUser = useCallback(
    (assignee: GitHubUser | null) => {
      closeAssignUserModal();
      handleAssignUser({ type, assignee });
    },
    [handleAssignUser, type],
  );
  const doRefreshOrg = useCallback(() => {
    /* istanbul ignore else */
    if (org?.org_type === ORG_TYPES.QA && handleRefresh) {
      handleRefresh(org);
    }
  }, [handleRefresh, org, org?.org_type]);
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

  const handleEmptyMessageClick = useCallback(() => {
    history.push(
      addUrlParams(projectUrl, { [SHOW_PROJECT_COLLABORATORS]: true }),
    );
  }, [projectUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const taskCommits = getTaskCommits(task);
  const orgCommitIdx = org ? taskCommits.indexOf(org.latest_commit) : -1;
  // We consider an org out-of-date if it is not based on the first commit.
  const testOrgOutOfDate = Boolean(
    type === ORG_TYPES.QA && org && orgCommitIdx !== 0,
  );

  const readyForReview = Boolean(
    task.pr_is_open &&
      assignedToCurrentUser &&
      type === ORG_TYPES.QA &&
      !testOrgOutOfDate &&
      (ownedByCurrentUser || (!org && task.review_valid)),
  );

  const heading =
    type === ORG_TYPES.QA ? i18n.t('Tester') : i18n.t('Developer');
  const orgHeading =
    type === ORG_TYPES.QA ? i18n.t('Test Org') : i18n.t('Dev Org');
  const userModalHeading =
    type === ORG_TYPES.QA
      ? i18n.t('Assign Tester')
      : i18n.t('Assign Developer');

  return (
    <div
      className="slds-size_1-of-1
        slds-large-size_1-of-2
        slds-p-around_x-small"
    >
      <Card
        className={classNames({ 'has-nested-card': assignedUser })}
        bodyClassName="slds-card__body_inner"
        heading={heading}
        headerActions={
          <UserActions
            type={type}
            assignedUser={assignedUser}
            openAssignUserModal={openAssignUserModal}
            setUser={doAssignUser}
          />
        }
        footer={
          <Footer
            org={org}
            ownedByCurrentUser={ownedByCurrentUser}
            isCreating={isCreating}
            isDeleting={isDeleting}
            isRefreshingChanges={isRefreshingChanges}
            isRefreshingOrg={isRefreshingOrg}
            testOrgOutOfDate={testOrgOutOfDate}
            readyForReview={readyForReview}
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
                  ownedByCurrentUser={ownedByCurrentUser}
                  assignedToCurrentUser={assignedToCurrentUser}
                  ownedByWrongUser={ownedByWrongUser}
                  testOrgOutOfDate={testOrgOutOfDate}
                  readyForReview={readyForReview}
                  isCreating={isCreating}
                  isDeleting={isDeleting}
                  isRefreshingOrg={isRefreshingOrg}
                  isSubmittingReview={isSubmittingReview}
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
                taskCommits={taskCommits}
                repoUrl={repoUrl}
                ownedByCurrentUser={ownedByCurrentUser}
                ownedByWrongUser={ownedByWrongUser}
                isCreating={isCreating}
                isRefreshingOrg={isRefreshingOrg}
                isSubmittingReview={isSubmittingReview}
                testOrgOutOfDate={testOrgOutOfDate}
                missingCommits={orgCommitIdx}
                doCheckForOrgChanges={doCheckForOrgChanges}
                openCaptureModal={openCaptureModal}
              />
              <OrgSpinner
                org={org}
                ownedByCurrentUser={ownedByCurrentUser}
                isDeleting={isDeleting}
                isRefreshingChanges={isRefreshingChanges}
              />
            </Card>
          </>
        )}
      </Card>
      <AssignUserModal
        allUsers={projectUsers}
        selectedUser={assignedUser}
        heading={userModalHeading}
        isOpen={assignUserModalOpen}
        emptyMessageText={i18n.t('View Project to Add Collaborators')}
        emptyMessageAction={handleEmptyMessageClick}
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
      {readyForReview && (
        <SubmitReviewModal
          orgId={org?.id}
          url={window.api_urls.task_review(task.id)}
          reviewStatus={task.review_valid ? task.review_status : null}
          isOpen={submitReviewModalOpen && !isSubmittingReview}
          handleClose={closeSubmitReviewModal}
        />
      )}
    </div>
  );
};

export default withRouter(OrgCard);
