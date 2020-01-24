import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Icon from '@salesforce/design-system-react/components/icon';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import Modal from '@salesforce/design-system-react/components/modal';
import { format, formatDistanceToNow } from 'date-fns';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import ConnectModal from '@/components/user/connect';
import { ConnectionInfoModal } from '@/components/user/info';
import {
  ExternalLink,
  LabelWithSpinner,
  SpinnerWrapper,
  useIsMounted,
} from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { createObject, deleteObject } from '@/store/actions';
import { refetchOrg } from '@/store/orgs/actions';
import { Org, OrgsByTask } from '@/store/orgs/reducer';
import { GitHubUser } from '@/store/repositories/reducer';
import { Task } from '@/store/tasks/reducer';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { OBJECT_TYPES, ORG_TYPES, OrgTypes } from '@/utils/constants';
import { getOrgStatusMsg } from '@/utils/helpers';

interface OrgTypeTracker {
  [ORG_TYPES.DEV]: boolean;
  [ORG_TYPES.QA]: boolean;
}

const OrgTypeTrackerDefault = {
  [ORG_TYPES.DEV]: false,
  [ORG_TYPES.QA]: false,
};

const ConfirmDeleteModal = ({
  confirmDeleteModalOpen,
  toggleModal,
  orgs,
  handleDelete,
}: {
  confirmDeleteModalOpen: OrgTypes | null;
  toggleModal: React.Dispatch<React.SetStateAction<OrgTypes | null>>;
  orgs: OrgsByTask;
  handleDelete: (org: Org) => void;
}) => {
  const handleClose = () => {
    toggleModal(null);
  };
  const handleSubmit = () => {
    handleClose();
    const org = confirmDeleteModalOpen && orgs[confirmDeleteModalOpen];
    /* istanbul ignore else */
    if (org) {
      handleDelete(org);
    }
  };

  return (
    <Modal
      isOpen={Boolean(confirmDeleteModalOpen)}
      heading={i18n.t('Confirm Delete Org')}
      prompt="warning"
      onRequestClose={handleClose}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={handleClose} />,
        <Button
          key="submit"
          label={i18n.t('Delete')}
          variant="brand"
          onClick={handleSubmit}
        />,
      ]}
    >
      <div className="slds-p-vertical_medium">
        {i18n.t(
          'Are you sure you want to delete this org with uncaptured changes?',
        )}
      </div>
    </Modal>
  );
};

const OrgIcon = ({
  org,
  ownedByCurrentUser,
  isCreating,
  isDeleting,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isCreating: boolean;
  isDeleting: boolean;
}) => {
  if (org && !isCreating) {
    const orgUrl = window.api_urls.scratch_org_redirect(org.id);
    if (orgUrl && ownedByCurrentUser && !isDeleting) {
      return (
        <ExternalLink url={orgUrl} title={i18n.t('View Org')}>
          <Icon
            category="utility"
            name="link"
            size="x-small"
            className="icon-link slds-m-bottom_xxx-small"
          />
        </ExternalLink>
      );
    }
    return (
      <Icon
        category="utility"
        name="link"
        size="x-small"
        className="slds-m-bottom_xxx-small"
      />
    );
  }
  return null;
};

const OrgFooter = ({
  org,
  ownedByCurrentUser,
  isCreating,
  isDeleting,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isCreating: boolean;
  isDeleting: boolean;
}) => {
  const loadingMsg = i18n.t(
    'This process could take a number of minutes. Feel free to leave this page and check back later.',
  );
  if (isCreating) {
    return <>loadingMsg</>;
  }
  if (org) {
    if (isDeleting) {
      return (
        <>
          <SpinnerWrapper size="small" />
          {i18n.t('Deleting Org…')}
        </>
      );
    }
    if (ownedByCurrentUser) {
      if (org.currently_capturing_changes) {
        return (
          <>
            <SpinnerWrapper size="small" />
            {i18n.t('Capturing Selected Changes…')}
            <div className="slds-p-top_small">{loadingMsg}</div>
          </>
        );
      }
      if (org.currently_refreshing_changes) {
        return (
          <>
            <SpinnerWrapper size="small" />
            {i18n.t('Checking for Uncaptured Changes…')}
          </>
        );
      }
      const orgUrl = window.api_urls.scratch_org_redirect(org.id);
      /* istanbul ignore else */
      // eslint-disable-next-line no-lonely-if
      if (orgUrl) {
        return <ExternalLink url={orgUrl}>{i18n.t('View Org')}</ExternalLink>;
      }
    }
  }
  return null;
};

const OrgActions = ({
  org,
  ownedByCurrentUser,
  isCreating,
  isDeleting,
  doCreateAction,
  doDeleteAction,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  doCreateAction: () => void;
  doDeleteAction: () => void;
}) => {
  if (isCreating) {
    return (
      <Button
        label={<LabelWithSpinner label={i18n.t('Creating Org…')} />}
        disabled
      />
    );
  }
  if (!org) {
    return <Button label={i18n.t('Create Org')} onClick={doCreateAction} />;
  }
  if (ownedByCurrentUser && !isDeleting) {
    return (
      <Dropdown
        align="right"
        assistiveText={{ icon: 'Actions' }}
        buttonClassName="slds-button_icon-x-small"
        buttonVariant="icon"
        iconCategory="utility"
        iconName="down"
        iconSize="small"
        iconVariant="border-filled"
        width="xx-small"
        options={[{ id: 0, label: i18n.t('Delete') }]}
        onSelect={doDeleteAction}
      />
    );
  }
  return null;
};

const OrgContents = ({
  org,
  ownedByCurrentUser,
  isCreating,
  isDev,
  doRefreshAction,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isCreating: boolean;
  isDev: boolean;
  doRefreshAction: () => void;
}) => {
  if (!org || isCreating) {
    return null;
  }
  const expiresAt = org.expires_at && new Date(org.expires_at);
  return (
    <ul>
      {org.latest_commit && (
        <li>
          <strong>{i18n.t('Deployed Commit')}:</strong>{' '}
          {org.latest_commit_url ? (
            <ExternalLink url={org.latest_commit_url}>
              {org.latest_commit.substring(0, 7)}
            </ExternalLink>
          ) : (
            org.latest_commit.substring(0, 7)
          )}
        </li>
      )}
      {expiresAt && (
        <li>
          <strong>{i18n.t('Expires')}:</strong>{' '}
          <span title={format(expiresAt, 'PPpp')}>
            {formatDistanceToNow(expiresAt, { addSuffix: true })}
          </span>
        </li>
      )}
      {isDev && (
        <li>
          <strong>{i18n.t('Status')}:</strong> {getOrgStatusMsg(org)}
          {ownedByCurrentUser && (
            <>
              {' | '}
              <Button
                label={i18n.t('check again')}
                variant="link"
                onClick={doRefreshAction}
              />
            </>
          )}
        </li>
      )}
    </ul>
  );
};

const OrgCard = ({
  orgs,
  type,
  displayType,
  userId,
  assignedUser,
  isCreatingOrg,
  isDeletingOrg,
  createAction,
  deleteAction,
  refreshAction,
}: {
  orgs: OrgsByTask;
  type: OrgTypes;
  displayType: string;
  userId?: string;
  assignedUser: GitHubUser | null;
  isCreatingOrg: OrgTypeTracker;
  isDeletingOrg: OrgTypeTracker;
  createAction: (type: OrgTypes) => void;
  deleteAction: (org: Org) => void;
  refreshAction: (org: Org) => void;
}) => {
  const org = orgs[type];
  const ownedByCurrentUser = Boolean(
    userId && org?.url && userId === org.owner,
  );
  const isCreating = Boolean(isCreatingOrg[type] || (org && !org.url));
  const isDeleting = Boolean(isDeletingOrg[type] || org?.delete_queued_at);
  const doCreateAction = useCallback(() => {
    createAction(type);
  }, [createAction, type]);
  const doDeleteAction = useCallback(() => {
    /* istanbul ignore else */
    if (org) {
      deleteAction(org);
    }
  }, [deleteAction, org]);
  const doRefreshAction = useCallback(() => {
    /* istanbul ignore else */
    if (org) {
      refreshAction(org);
    }
  }, [refreshAction, org]);

  return (
    <div
      className="slds-size_1-of-1
        slds-large-size_1-of-2
        slds-p-around_x-small"
    >
      <Card
        bodyClassName="slds-card__body_inner"
        icon={
          <OrgIcon
            org={org}
            ownedByCurrentUser={ownedByCurrentUser}
            isCreating={isCreating}
            isDeleting={isDeleting}
          />
        }
        heading={displayType}
        headerActions={
          <OrgActions
            org={org}
            ownedByCurrentUser={ownedByCurrentUser}
            isCreating={isCreating}
            isDeleting={isDeleting}
            doCreateAction={doCreateAction}
            doDeleteAction={doDeleteAction}
          />
        }
        footer={
          <OrgFooter
            org={org}
            ownedByCurrentUser={ownedByCurrentUser}
            isCreating={isCreating}
            isDeleting={isDeleting}
          />
        }
      >
        <OrgContents
          org={org}
          ownedByCurrentUser={ownedByCurrentUser}
          isCreating={isCreating}
          isDev={type === ORG_TYPES.DEV}
          doRefreshAction={doRefreshAction}
        />
      </Card>
    </div>
  );
};

const OrgCards = ({ orgs, task }: { orgs: OrgsByTask; task: Task }) => {
  const user = useSelector(selectUserState);
  const isMounted = useIsMounted();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [
    confirmDeleteModalOpen,
    setConfirmDeleteModalOpen,
  ] = useState<OrgTypes | null>(null);
  const [isCreatingOrg, setIsCreatingOrg] = useState<OrgTypeTracker>(
    OrgTypeTrackerDefault,
  );
  const [isDeletingOrg, setIsDeletingOrg] = useState<OrgTypeTracker>(
    OrgTypeTrackerDefault,
  );
  const [isWaitingToDeleteDevOrg, setIsWaitingToDeleteDevOrg] = useState(false);
  const dispatch = useDispatch<ThunkDispatch>();

  const devOrg = orgs[ORG_TYPES.DEV];

  const doRefetchOrg = useCallback((org: Org) => {
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

  const openConnectModal = () => {
    setInfoModalOpen(false);
    setConnectModalOpen(true);
  };
  const openInfoModal = () => {
    setConnectModalOpen(false);
    setInfoModalOpen(true);
  };

  let deleteAction: (...args: any[]) => void = openConnectModal;
  let createAction: (...args: any[]) => void = openConnectModal;
  if (user?.valid_token_for) {
    createAction = user.is_devhub_enabled ? createOrg : openInfoModal;
    deleteAction = (org: Org) => {
      if (org.org_type === ORG_TYPES.DEV) {
        setIsWaitingToDeleteDevOrg(true);
        doRefetchOrg(org);
      } else {
        deleteOrg(org);
      }
    };
  }

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

  return (
    <>
      <h2 className="slds-text-heading_medium">{i18n.t('Task Orgs')}</h2>
      <div className="slds-grid slds-wrap slds-grid_pull-padded-x-small">
        <OrgCard
          orgs={orgs}
          type={ORG_TYPES.DEV}
          displayType={i18n.t('Developer')}
          userId={user?.id}
          assignedUser={task.assigned_dev}
          isCreatingOrg={isCreatingOrg}
          isDeletingOrg={isDeletingOrg}
          createAction={createAction}
          deleteAction={deleteAction}
          refreshAction={doRefetchOrg}
        />
        <OrgCard
          orgs={orgs}
          type={ORG_TYPES.QA}
          displayType={i18n.t('Reviewer')}
          userId={user?.id}
          assignedUser={task.assigned_qa}
          isCreatingOrg={isCreatingOrg}
          isDeletingOrg={isDeletingOrg}
          createAction={createAction}
          deleteAction={deleteAction}
          refreshAction={doRefetchOrg}
        />
      </div>
      <ConnectModal
        user={user as User}
        isOpen={connectModalOpen}
        toggleModal={setConnectModalOpen}
      />
      <ConnectionInfoModal
        user={user as User}
        isOpen={infoModalOpen}
        toggleModal={setInfoModalOpen}
        onDisconnect={openConnectModal}
      />
      <ConfirmDeleteModal
        confirmDeleteModalOpen={confirmDeleteModalOpen}
        toggleModal={setConfirmDeleteModalOpen}
        orgs={orgs}
        handleDelete={deleteOrg}
      />
    </>
  );
};

export default OrgCards;
