import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import OrgCard from '@/components/tasks/cards/card';
import ConfirmRemoveUserModal from '@/components/tasks/cards/confirmRemoveUserModal';
import ConfirmDeleteModal from '@/components/tasks/confirmDeleteModal';
import ConnectModal from '@/components/user/connect';
import { ConnectionInfoModal } from '@/components/user/info';
import { useIsMounted } from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { createObject, deleteObject, updateObject } from '@/store/actions';
import { refetchOrg } from '@/store/orgs/actions';
import { Org, OrgsByTask } from '@/store/orgs/reducer';
import { Task } from '@/store/tasks/reducer';
import { GitHubUser, User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { OBJECT_TYPES, ORG_TYPES, OrgTypes } from '@/utils/constants';

export interface AssignedUserTracker {
  type: OrgTypes;
  assignee: GitHubUser | null;
}

interface OrgTypeTracker {
  [ORG_TYPES.DEV]: boolean;
  [ORG_TYPES.QA]: boolean;
}

const OrgTypeTrackerDefault = {
  [ORG_TYPES.DEV]: false,
  [ORG_TYPES.QA]: false,
};

const OrgCards = ({
  orgs,
  task,
  projectUsers,
  projectUrl,
}: {
  orgs: OrgsByTask;
  task: Task;
  projectUsers: GitHubUser[];
  projectUrl: string;
}) => {
  const user = useSelector(selectUserState) as User;
  const isMounted = useIsMounted();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [
    confirmDeleteModalOpen,
    setConfirmDeleteModalOpen,
  ] = useState<OrgTypes | null>(null);
  const [
    confirmRemoveUserModalOpen,
    setConfirmRemoveUserModalOpen,
  ] = useState<AssignedUserTracker | null>(null);
  const [isWaitingToDeleteDevOrg, setIsWaitingToDeleteDevOrg] = useState(false);
  const [
    isWaitingToRemoveUser,
    setIsWaitingToRemoveUser,
  ] = useState<AssignedUserTracker | null>(null);
  const [isCreatingOrg, setIsCreatingOrg] = useState<OrgTypeTracker>(
    OrgTypeTrackerDefault,
  );
  const [isDeletingOrg, setIsDeletingOrg] = useState<OrgTypeTracker>(
    OrgTypeTrackerDefault,
  );
  const dispatch = useDispatch<ThunkDispatch>();

  const checkForOrgChanges = useCallback((org: Org) => {
    dispatch(refetchOrg(org));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteOrg = useCallback((org: Org) => {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createOrg = useCallback((type: OrgTypes) => {
    setIsCreatingOrg({ ...isCreatingOrg, [type]: true });
    dispatch(
      createObject({
        objectType: OBJECT_TYPES.ORG,
        // eslint-disable-next-line @typescript-eslint/camelcase
        data: { task: task.id, org_type: type },
        shouldSubscribeToObject: true,
      }),
    ).finally(() => {
      /* istanbul ignore else */
      if (isMounted.current) {
        setIsCreatingOrg({ ...isCreatingOrg, [type]: false });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const assignUser = useCallback(
    ({ type, assignee }: AssignedUserTracker) => {
      const userType = type === ORG_TYPES.DEV ? 'assigned_dev' : 'assigned_qa';
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.TASK,
          data: {
            ...task,
            [userType]: assignee,
          },
        }),
      );
    },
    [task], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const closeConfirmDeleteModal = () => {
    setConfirmDeleteModalOpen(null);
  };
  const closeConfirmRemoveUserModal = () => {
    setConfirmRemoveUserModalOpen(null);
  };
  const openConnectModal = () => {
    setInfoModalOpen(false);
    closeConfirmDeleteModal();
    closeConfirmRemoveUserModal();
    setConnectModalOpen(true);
  };
  const openInfoModal = () => {
    setConnectModalOpen(false);
    closeConfirmDeleteModal();
    closeConfirmRemoveUserModal();
    setInfoModalOpen(true);
  };

  const handleDelete = (
    org: Org,
    shouldRemoveUser?: AssignedUserTracker | null,
  ) => {
    setIsWaitingToRemoveUser(shouldRemoveUser || null);
    if (org.org_type === ORG_TYPES.DEV) {
      setIsWaitingToDeleteDevOrg(true);
      checkForOrgChanges(org);
    } else {
      deleteOrg(org);
    }
  };

  let handleCreate: (...args: any[]) => void = openConnectModal;
  if (user.valid_token_for || user.devhub_username) {
    handleCreate = user.is_devhub_enabled ? createOrg : openInfoModal;
  }

  const handleAssignUser = ({ type, assignee }: AssignedUserTracker) => {
    const orgOwner = orgs[type]?.owner_gh_username;
    const newAssigned = assignee?.login;
    if (orgs[type] && (!orgOwner || orgOwner !== newAssigned)) {
      setConfirmRemoveUserModalOpen({ type, assignee });
    } else {
      assignUser({ type, assignee });
    }
  };

  const devOrg = orgs[ORG_TYPES.DEV];

  // When dev org delete has been triggered, wait until it has been refreshed...
  useEffect(() => {
    const readyToDeleteOrg =
      isWaitingToDeleteDevOrg && devOrg && !devOrg.currently_refreshing_changes;

    if (readyToDeleteOrg && devOrg) {
      setIsWaitingToDeleteDevOrg(false);
      if (devOrg.has_unsaved_changes) {
        setConfirmDeleteModalOpen(devOrg.org_type);
      } else {
        deleteOrg(devOrg);
      }
    }
  }, [deleteOrg, isWaitingToDeleteDevOrg, devOrg]);

  // After org is deleted, check if we also need to update the assigned user...
  useEffect(() => {
    if (isWaitingToRemoveUser) {
      const { type, assignee } = isWaitingToRemoveUser;
      const readyToUpdateUser = !orgs[type];
      if (readyToUpdateUser) {
        setIsWaitingToRemoveUser(null);
        assignUser({ type, assignee });
      }
    }
  }, [assignUser, isWaitingToRemoveUser, orgs]);

  const taskCommits = task.commits.map((c) => c.id);
  if (task.origin_sha) {
    taskCommits.push(task.origin_sha);
  }

  return (
    <>
      <h2 className="slds-text-heading_medium">{i18n.t('Task Team & Orgs')}</h2>
      <div className="slds-grid slds-wrap slds-grid_pull-padded-x-small">
        <OrgCard
          org={orgs[ORG_TYPES.DEV]}
          type={ORG_TYPES.DEV}
          user={user}
          assignedUser={task.assigned_dev}
          projectUsers={projectUsers}
          projectUrl={projectUrl}
          isCreatingOrg={isCreatingOrg[ORG_TYPES.DEV]}
          isDeletingOrg={isDeletingOrg[ORG_TYPES.DEV]}
          handleAssignUser={handleAssignUser}
          handleCreate={handleCreate}
          handleDelete={handleDelete}
          handleCheckForOrgChanges={checkForOrgChanges}
        />
        <OrgCard
          org={orgs[ORG_TYPES.QA]}
          type={ORG_TYPES.QA}
          user={user}
          assignedUser={task.assigned_qa}
          projectUsers={projectUsers}
          projectUrl={projectUrl}
          taskCommits={taskCommits}
          isCreatingOrg={isCreatingOrg[ORG_TYPES.QA]}
          isDeletingOrg={isDeletingOrg[ORG_TYPES.QA]}
          handleAssignUser={handleAssignUser}
          handleCreate={handleCreate}
          handleDelete={handleDelete}
          handleCheckForOrgChanges={checkForOrgChanges}
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
        orgs={orgs}
        orgType={confirmDeleteModalOpen}
        handleClose={closeConfirmDeleteModal}
        handleDelete={deleteOrg}
      />
      <ConfirmRemoveUserModal
        orgs={orgs}
        assignedUser={confirmRemoveUserModalOpen}
        handleClose={closeConfirmRemoveUserModal}
        handleDelete={handleDelete}
      />
    </>
  );
};

export default OrgCards;
