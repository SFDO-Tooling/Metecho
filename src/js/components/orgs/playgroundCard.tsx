import Card from '@salesforce/design-system-react/components/card';
import { t } from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import Footer from '@/js/components/orgs/cards/footer';
import OrgActions from '@/js/components/orgs/cards/orgActions';
import OrgIcon from '@/js/components/orgs/cards/orgIcon';
import OrgInfo from '@/js/components/orgs/cards/orgInfo';
import OrgSpinner from '@/js/components/orgs/cards/orgSpinner';
import ConfirmDeleteModal from '@/js/components/tasks/confirmDeleteModal';
import { useIsMounted } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { deleteObject } from '@/js/store/actions';
import { Epic } from '@/js/store/epics/reducer';
import { refetchOrg, refreshOrg } from '@/js/store/orgs/actions';
import { Org } from '@/js/store/orgs/reducer';
import { Project } from '@/js/store/projects/reducer';
import { Task } from '@/js/store/tasks/reducer';
import {
  CONFIRM_ORG_TRACKER,
  ConfirmOrgTracker,
  OBJECT_TYPES,
} from '@/js/utils/constants';
import { getTaskCommits } from '@/js/utils/helpers';

interface PlaygroundCardProps {
  org: Org;
  project?: Project;
  epic?: Epic;
  task?: Task;
  repoUrl: string;
  openContributeModal?: () => void;
}

const PlaygroundOrgCard = ({
  org,
  project,
  epic,
  task,
  repoUrl,
  openContributeModal,
}: PlaygroundCardProps) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] =
    useState<ConfirmOrgTracker>(null);
  const [isWaitingToDeleteOrg, setIsWaitingToDeleteOrg] =
    useState<ConfirmOrgTracker>(null);
  const isMounted = useIsMounted();

  let heading: string, baseCommit: string;
  let missingCommits = -1;
  let orgOutOfDate = false;

  if (task) {
    heading = t('Task Scratch Org');
    const taskCommits = getTaskCommits(task);
    missingCommits = taskCommits.indexOf(org.latest_commit);
    // We consider an org out-of-date if it is not based on the first commit.
    orgOutOfDate = missingCommits !== 0;
    baseCommit = taskCommits[0];
  } else if (epic) {
    heading = t('Epic Scratch Org');
    baseCommit = epic.latest_sha;
    orgOutOfDate = Boolean(baseCommit && org.latest_commit !== baseCommit);
  } else {
    heading = t('Project Scratch Org');
    baseCommit = (project as Project).latest_sha;
    orgOutOfDate = Boolean(baseCommit && org.latest_commit !== baseCommit);
  }
  const isCreating = Boolean(org && !org.is_created);
  const isDeleting = Boolean(isDeletingOrg || org?.delete_queued_at);
  const isRefreshingChanges = Boolean(org?.currently_refreshing_changes);
  const isRefreshingOrg = Boolean(org?.currently_refreshing_org);

  const doDeleteOrg = useCallback(() => {
    setIsDeletingOrg(true);
    dispatch(
      deleteObject({
        objectType: OBJECT_TYPES.ORG,
        object: org,
      }),
    ).finally(() => {
      /* istanbul ignore else */
      if (isMounted.current) {
        setIsDeletingOrg(false);
      }
    });
  }, [dispatch, isMounted, org]);

  const doCheckForOrgChanges = useCallback(() => {
    dispatch(refetchOrg(org));
  }, [dispatch, org]);

  const doRefreshOrg = useCallback(() => {
    dispatch(refreshOrg(org));
  }, [dispatch, org]);

  const handleDelete = useCallback(() => {
    doCheckForOrgChanges();
    setIsWaitingToDeleteOrg(CONFIRM_ORG_TRACKER.DELETE);
  }, [doCheckForOrgChanges]);

  const handleRefresh = useCallback(() => {
    doCheckForOrgChanges();
    setIsWaitingToDeleteOrg(CONFIRM_ORG_TRACKER.REFRESH);
  }, [doCheckForOrgChanges]);

  const closeConfirmDeleteModal = () => {
    setConfirmDeleteModalOpen(null);
  };
  const cancelConfirmDeleteModal = useCallback(() => {
    setIsWaitingToDeleteOrg(null);
    closeConfirmDeleteModal();
  }, []);

  // When org delete has been triggered, wait until it has been refreshed...
  useEffect(() => {
    const readyToDeleteOrg =
      isWaitingToDeleteOrg && !org.currently_refreshing_changes;
    const action = isWaitingToDeleteOrg;

    if (readyToDeleteOrg) {
      setIsWaitingToDeleteOrg(null);
      if (org.has_unsaved_changes) {
        setConfirmDeleteModalOpen(action);
      } else if (action === CONFIRM_ORG_TRACKER.REFRESH) {
        doRefreshOrg();
      } else {
        doDeleteOrg();
      }
    }
  }, [doDeleteOrg, doRefreshOrg, isWaitingToDeleteOrg, org]);

  /* istanbul ignore next */
  if (!(project || epic || task)) {
    return null;
  }

  return (
    <>
      <Card
        bodyClassName="slds-card__body_inner"
        className="wrap-inner-truncate narrow-buttons playground-org-card"
        heading={heading}
        icon={
          org &&
          !isCreating && (
            <OrgIcon
              orgId={org.id}
              ownedByCurrentUser
              isDeleting={isDeleting}
              isRefreshingOrg={isRefreshingOrg}
            />
          )
        }
        headerActions={
          <OrgActions
            org={org}
            type={org.org_type}
            disableCreation
            ownedByCurrentUser
            orgOutOfDate={orgOutOfDate}
            isCreating={isCreating}
            isDeleting={isDeleting}
            isRefreshingOrg={isRefreshingOrg}
            doDeleteOrg={handleDelete}
            doRefreshOrg={handleRefresh}
            openContributeModal={openContributeModal}
          />
        }
        footer={
          <Footer
            org={org}
            ownedByCurrentUser
            isCreating={isCreating}
            isDeleting={isDeleting}
            isRefreshingChanges={isRefreshingChanges}
            isRefreshingOrg={isRefreshingOrg}
          />
        }
      >
        <OrgInfo
          org={org}
          type={org.org_type}
          baseCommit={baseCommit}
          repoUrl={repoUrl}
          ownedByCurrentUser
          isCreating={isCreating}
          isRefreshingOrg={isRefreshingOrg}
          orgOutOfDate={orgOutOfDate}
          missingCommits={-1}
          doCheckForOrgChanges={doCheckForOrgChanges}
        />
        <OrgSpinner
          org={org}
          ownedByCurrentUser
          isDeleting={isDeleting}
          isRefreshingChanges={isRefreshingChanges}
        />
      </Card>
      <ConfirmDeleteModal
        org={org}
        isOpen={Boolean(confirmDeleteModalOpen)}
        actionType={confirmDeleteModalOpen}
        handleClose={closeConfirmDeleteModal}
        handleCancel={cancelConfirmDeleteModal}
        handleAction={
          confirmDeleteModalOpen === CONFIRM_ORG_TRACKER.REFRESH
            ? doRefreshOrg
            : doDeleteOrg
        }
      />
    </>
  );
};

export default PlaygroundOrgCard;
