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
import UserActions from '@/components/tasks/cards/userActions';
import { AssignUserModal, UserCard } from '@/components/user/githubUser';
import { Org } from '@/store/orgs/reducer';
import { GitHubUser, User } from '@/store/user/reducer';
import { ORG_TYPES, OrgTypes } from '@/utils/constants';
import { logError } from '@/utils/logging';

const OrgCard = ({
  org,
  type,
  user,
  assignedUser,
  projectUsers,
  projectUrl,
  isCreatingOrg,
  isDeletingOrg,
  handleAssignUser,
  handleCreate,
  handleDelete,
  handleCheckForOrgChanges,
  history,
}: {
  org: Org | null;
  type: OrgTypes;
  user: User;
  assignedUser: GitHubUser | null;
  projectUsers: GitHubUser[];
  projectUrl: string;
  isCreatingOrg: boolean;
  isDeletingOrg: boolean;
  handleAssignUser: ({ type, assignee }: AssignedUserTracker) => void;
  handleCreate: (type: OrgTypes) => void;
  handleDelete: (
    org: Org,
    shouldRemoveUser?: AssignedUserTracker | null,
  ) => void;
  handleCheckForOrgChanges: (org: Org) => void;
} & RouteComponentProps) => {
  const assignedToCurrentUser = user.username === assignedUser?.login;
  const ownedByCurrentUser = Boolean(org?.url && user.id === org?.owner);
  const ownedByWrongUser =
    org?.url && org.owner_gh_username !== assignedUser?.login ? org : null;
  const isCreating = Boolean(isCreatingOrg || (org && !org.url));
  const isDeleting = Boolean(isDeletingOrg || org?.delete_queued_at);
  const isRefreshing = Boolean(org?.currently_refreshing_changes);

  // If (somehow) there's an org owned by someone else, do not show org.
  if (ownedByWrongUser) {
    logError(
      'A scratch org exists for this task, but is not owned by the assigned user.',
      {
        org,
        assignedUser,
      },
    );
    org = null;
  }

  const [assignUserModalOpen, setAssignUserModalOpen] = useState(false);
  const openAssignUserModal = () => {
    setAssignUserModalOpen(true);
  };
  const closeAssignUserModal = () => {
    setAssignUserModalOpen(false);
  };

  const doAssignUser = useCallback(
    (assignee: GitHubUser | null) => {
      closeAssignUserModal();
      handleAssignUser({ type, assignee });
    },
    [handleAssignUser, type],
  );
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
    history.push(projectUrl);
  }, [projectUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const heading =
    type === ORG_TYPES.QA ? i18n.t('Reviewer') : i18n.t('Developer');
  const orgHeading =
    type === ORG_TYPES.QA ? i18n.t('Review Org') : i18n.t('Dev Org');
  const userModalHeading =
    type === ORG_TYPES.QA
      ? i18n.t('Assign Reviewer')
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
            isRefreshing={isRefreshing}
          />
        }
      >
        {assignedUser && (
          <div className="slds-m-bottom_small">
            <UserCard user={assignedUser} className="nested-card" />
          </div>
        )}
        {(assignedUser || ownedByWrongUser) && (
          <>
            <hr className="slds-m-vertical_none" />
            <Card
              className="nested-card"
              heading={orgHeading}
              icon={
                org &&
                !isCreating && (
                  <OrgIcon
                    orgId={org.id}
                    ownedByCurrentUser={ownedByCurrentUser}
                    isDeleting={isDeleting}
                  />
                )
              }
              headerActions={
                <OrgActions
                  org={org}
                  ownedByCurrentUser={ownedByCurrentUser}
                  assignedToCurrentUser={assignedToCurrentUser}
                  ownedByWrongUser={ownedByWrongUser}
                  isCreating={isCreating}
                  isDeleting={isDeleting}
                  doCreateOrg={doCreateOrg}
                  doDeleteOrg={doDeleteOrg}
                />
              }
            >
              <OrgInfo
                org={org}
                type={type}
                ownedByCurrentUser={ownedByCurrentUser}
                assignedToCurrentUser={assignedToCurrentUser}
                ownedByWrongUser={ownedByWrongUser}
                isCreating={isCreating}
                doCheckForOrgChanges={doCheckForOrgChanges}
              />
              <OrgSpinner
                org={org}
                ownedByCurrentUser={ownedByCurrentUser}
                isDeleting={isDeleting}
                isRefreshing={isRefreshing}
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
        emptyMessageAction={handleEmptyMessageClick}
        onRequestClose={closeAssignUserModal}
        setUser={doAssignUser}
      />
    </div>
  );
};

export default withRouter(OrgCard);
