import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import TaskOrgCard from '~js/components/orgs/taskOrgCard';
import ConfirmDeleteModal from '~js/components/tasks/confirmDeleteModal';
import ConfirmRemoveUserModal from '~js/components/tasks/confirmRemoveUserModal';
import ConnectModal from '~js/components/user/connect';
import { ConnectionInfoModal } from '~js/components/user/info';
import { useIsMounted } from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { deleteObject, updateObject } from '~js/store/actions';
import { refetchOrg } from '~js/store/orgs/actions';
import { Org, OrgsByParent } from '~js/store/orgs/reducer';
import { Task } from '~js/store/tasks/reducer';
import { GitHubUser, User } from '~js/store/user/reducer';
import { selectUserState } from '~js/store/user/selectors';
import apiFetch from '~js/utils/api';
import { OBJECT_TYPES, ORG_TYPES, OrgTypes } from '~js/utils/constants';

export interface AssignedUserTracker {
  type: OrgTypes;
  assignee: string | null;
  shouldAlertAssignee: boolean;
}

export interface OrgTypeTracker {
  [ORG_TYPES.DEV]: boolean;
  [ORG_TYPES.QA]: boolean;
}

export const ORG_TYPE_TRACKER_DEFAULT = {
  [ORG_TYPES.DEV]: false,
  [ORG_TYPES.QA]: false,
};

const TaskOrgCards = ({
  orgs,
  task,
  projectId,
  userHasPermissions,
  epicUsers,
  githubUsers,
  epicCreatingBranch,
  epicUrl,
  repoUrl,
  assignUserModalOpen,
  isCreatingOrg,
  isRefreshingUsers,
  testOrgReadyForReview,
  testOrgSubmittingReview,
  openCaptureModal,
  openAssignUserModal,
  closeAssignUserModal,
  openSubmitReviewModal,
  doCreateOrg,
  doRefreshOrg,
}: {
  orgs: OrgsByParent;
  task: Task;
  projectId: string;
  userHasPermissions: boolean;
  epicUsers: GitHubUser[];
  githubUsers: GitHubUser[];
  epicCreatingBranch: boolean;
  epicUrl: string;
  repoUrl: string;
  assignUserModalOpen: OrgTypes | null;
  isCreatingOrg: OrgTypeTracker;
  isRefreshingUsers: boolean;
  testOrgReadyForReview: boolean;
  testOrgSubmittingReview: boolean;
  openCaptureModal: () => void;
  openAssignUserModal: (type: OrgTypes) => void;
  closeAssignUserModal: () => void;
  openSubmitReviewModal: () => void;
  doCreateOrg: (type: OrgTypes) => void;
  doRefreshOrg: (org: Org) => void;
}) => {
  const user = useSelector(selectUserState) as User;
  const isMounted = useIsMounted();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [confirmRemoveUserModalOpen, setConfirmRemoveUserModalOpen] =
    useState(false);
  const [isWaitingToDeleteDevOrg, setIsWaitingToDeleteDevOrg] = useState(false);
  const [isWaitingToRemoveUser, setIsWaitingToRemoveUser] =
    useState<AssignedUserTracker | null>(null);
  const [isDeletingOrg, setIsDeletingOrg] = useState<OrgTypeTracker>(
    ORG_TYPE_TRACKER_DEFAULT,
  );
  const dispatch = useDispatch<ThunkDispatch>();

  const checkForOrgChanges = useCallback(
    (org: Org) => {
      dispatch(refetchOrg(org));
    },
    [dispatch],
  );

  const checkIfTaskCanBeReassigned = async (assignee: string) => {
    const { can_reassign } = await apiFetch({
      url: `${window.api_urls.task_can_reassign(task.id)}`,
      dispatch,
      opts: {
        method: 'POST',
        body: JSON.stringify({
          role: 'assigned_dev',
          gh_uid: assignee,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });
    return can_reassign;
  };

  const deleteOrg = useCallback(
    (org: Org) => {
      setIsDeletingOrg({ ...isDeletingOrg, [org.org_type]: true });
      dispatch(
        deleteObject({
          objectType: OBJECT_TYPES.ORG,
          object: org,
        }),
      ).finally(() => {
        /* istanbul ignore else */
        if (isMounted.current) {
          setIsDeletingOrg({ ...isDeletingOrg, [org.org_type]: false });
        }
      });
    },
    [dispatch, isDeletingOrg, isMounted],
  );

  const assignUser = useCallback(
    ({ type, assignee, shouldAlertAssignee }: AssignedUserTracker) => {
      setIsWaitingToRemoveUser(null);
      const userType = type === ORG_TYPES.DEV ? 'assigned_dev' : 'assigned_qa';
      const alertType =
        type === ORG_TYPES.DEV ? 'should_alert_dev' : 'should_alert_qa';
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.TASK,
          url: window.api_urls.task_assignees(task.id),
          data: {
            [userType]: assignee,
            [alertType]: shouldAlertAssignee,
          },
        }),
      );
    },
    [dispatch, task],
  );

  const closeConfirmDeleteModal = () => {
    setConfirmDeleteModalOpen(false);
  };
  const cancelConfirmDeleteModal = useCallback(() => {
    setIsWaitingToDeleteDevOrg(false);
    closeConfirmDeleteModal();
  }, []);
  const closeConfirmRemoveUserModal = () => {
    setConfirmRemoveUserModalOpen(false);
  };
  const cancelConfirmRemoveUserModal = useCallback(() => {
    closeConfirmRemoveUserModal();
    setIsWaitingToRemoveUser(null);
  }, []);
  const openConnectModal = useCallback(() => {
    setInfoModalOpen(false);
    cancelConfirmDeleteModal();
    setConnectModalOpen(true);
  }, [cancelConfirmDeleteModal]);
  const openInfoModal = useCallback(() => {
    setConnectModalOpen(false);
    cancelConfirmDeleteModal();
    setInfoModalOpen(true);
  }, [cancelConfirmDeleteModal]);

  const handleDelete = (org: Org) => {
    if (org.org_type === ORG_TYPES.DEV) {
      checkForOrgChanges(org);
      setIsWaitingToDeleteDevOrg(true);
    } else {
      deleteOrg(org);
    }
  };

  const handleAssignUser = async ({
    type,
    assignee,
    shouldAlertAssignee,
  }: AssignedUserTracker) => {
    const org = orgs[type];
    if (org && type === ORG_TYPES.DEV) {
      let canReassign = false;
      if (assignee) {
        canReassign = await checkIfTaskCanBeReassigned(assignee);
      }
      if (canReassign) {
        assignUser({ type, assignee, shouldAlertAssignee });
      } else {
        checkForOrgChanges(org as Org);
        setIsWaitingToRemoveUser({ type, assignee, shouldAlertAssignee });
      }
    } /* istanbul ignore next */ else if (type !== ORG_TYPES.PLAYGROUND) {
      assignUser({ type, assignee, shouldAlertAssignee });
    }
  };

  let handleCreate: (...args: any[]) => void = openConnectModal;
  const userIsConnected =
    user.valid_token_for || user.devhub_username || user.uses_global_devhub;
  if (userIsConnected) {
    handleCreate = user.is_devhub_enabled ? doCreateOrg : openInfoModal;
  }

  /* istanbul ignore next */
  const openAssignDevModal = () => {
    openAssignUserModal(ORG_TYPES.DEV);
  };
  /* istanbul ignore next */
  const openAssignTesterModal = () => {
    openAssignUserModal(ORG_TYPES.QA);
  };
  const devOrg = orgs[ORG_TYPES.DEV];

  // When dev org delete has been triggered, wait until it has been refreshed...
  useEffect(() => {
    const readyToDeleteOrg =
      isWaitingToDeleteDevOrg && devOrg && !devOrg.currently_refreshing_changes;

    if (readyToDeleteOrg && devOrg) {
      setIsWaitingToDeleteDevOrg(false);
      if (devOrg.has_unsaved_changes) {
        setConfirmDeleteModalOpen(true);
      } else {
        deleteOrg(devOrg);
      }
    }
  }, [deleteOrg, isWaitingToDeleteDevOrg, devOrg]);

  // When dev org reassign has been triggered, wait until it has been refreshed
  useEffect(() => {
    if (
      isWaitingToRemoveUser &&
      devOrg &&
      !devOrg.currently_refreshing_changes
    ) {
      if (devOrg.has_unsaved_changes) {
        setConfirmRemoveUserModalOpen(true);
      } else {
        assignUser(isWaitingToRemoveUser);
      }
    }
  }, [assignUser, isWaitingToRemoveUser, devOrg]);

  return (
    <>
      <h2 className="slds-text-heading_medium">{i18n.t('Task Team & Orgs')}</h2>
      <div className="slds-grid slds-wrap slds-grid_pull-padded-x-small">
        <TaskOrgCard
          org={orgs[ORG_TYPES.DEV]}
          type={ORG_TYPES.DEV}
          user={user}
          task={task}
          projectId={projectId}
          userHasPermissions={userHasPermissions}
          epicUsers={epicUsers}
          githubUsers={githubUsers}
          epicCreatingBranch={epicCreatingBranch}
          epicUrl={epicUrl}
          repoUrl={repoUrl}
          isCreatingOrg={isCreatingOrg[ORG_TYPES.DEV]}
          isDeletingOrg={isDeletingOrg[ORG_TYPES.DEV]}
          isRefreshingUsers={isRefreshingUsers}
          assignUserModalOpen={assignUserModalOpen}
          openAssignUserModal={openAssignDevModal}
          closeAssignUserModal={closeAssignUserModal}
          handleAssignUser={handleAssignUser}
          handleCreate={handleCreate}
          handleDelete={handleDelete}
          handleCheckForOrgChanges={checkForOrgChanges}
          openCaptureModal={openCaptureModal}
        />
        <TaskOrgCard
          org={orgs[ORG_TYPES.QA]}
          type={ORG_TYPES.QA}
          user={user}
          task={task}
          projectId={projectId}
          userHasPermissions={userHasPermissions}
          epicUsers={epicUsers}
          githubUsers={githubUsers}
          epicCreatingBranch={epicCreatingBranch}
          epicUrl={epicUrl}
          repoUrl={repoUrl}
          isCreatingOrg={isCreatingOrg[ORG_TYPES.QA]}
          isDeletingOrg={isDeletingOrg[ORG_TYPES.QA]}
          isRefreshingUsers={isRefreshingUsers}
          assignUserModalOpen={assignUserModalOpen}
          openAssignUserModal={openAssignTesterModal}
          closeAssignUserModal={closeAssignUserModal}
          handleAssignUser={handleAssignUser}
          handleCreate={handleCreate}
          handleDelete={handleDelete}
          handleCheckForOrgChanges={checkForOrgChanges}
          handleRefresh={doRefreshOrg}
          openSubmitReviewModal={openSubmitReviewModal}
          testOrgReadyForReview={testOrgReadyForReview}
          testOrgSubmittingReview={testOrgSubmittingReview}
        />
      </div>
      <ConnectModal
        user={user}
        isOpen={connectModalOpen}
        toggleModal={setConnectModalOpen}
      />
      <ConnectionInfoModal
        user={user}
        isOpen={infoModalOpen}
        toggleModal={setInfoModalOpen}
        onDisconnect={openConnectModal}
      />
      <ConfirmDeleteModal
        org={devOrg}
        isOpen={confirmDeleteModalOpen}
        handleClose={closeConfirmDeleteModal}
        handleCancel={cancelConfirmDeleteModal}
        handleAction={deleteOrg}
      />
      <ConfirmRemoveUserModal
        isOpen={confirmRemoveUserModalOpen}
        waitingToRemoveUser={isWaitingToRemoveUser}
        handleClose={closeConfirmRemoveUserModal}
        handleCancel={cancelConfirmRemoveUserModal}
        handleAssignUser={assignUser}
      />
    </>
  );
};

export default TaskOrgCards;
