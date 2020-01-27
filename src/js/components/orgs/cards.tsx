import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Icon from '@salesforce/design-system-react/components/icon';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import Modal from '@salesforce/design-system-react/components/modal';
import classNames from 'classnames';
import { format, formatDistanceToNow } from 'date-fns';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import ConnectModal from '@/components/user/connect';
import { AssignUserModal, UserCard } from '@/components/user/githubUser';
import { ConnectionInfoModal } from '@/components/user/info';
import {
  ExternalLink,
  LabelWithSpinner,
  SpinnerWrapper,
  useIsMounted,
} from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { createObject, deleteObject, updateObject } from '@/store/actions';
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

const UserActions = ({
  type,
  assignedUser,
  openAssignUserModal,
  setUser,
}: {
  type: OrgTypes;
  assignedUser: GitHubUser | null;
  openAssignUserModal: () => void;
  setUser: (user: GitHubUser | null) => void;
}) => {
  if (assignedUser) {
    const actions =
      type === ORG_TYPES.QA
        ? [i18n.t('Change Reviewer'), i18n.t('Remove Reviewer')]
        : [i18n.t('Change Developer'), i18n.t('Remove Developer')];
    const handleSelect = (option: { id: string; label: string }) => {
      switch (option.id) {
        case 'edit':
          openAssignUserModal();
          break;
        case 'remove':
          setUser(null);
          break;
      }
    };
    return (
      <Dropdown
        align="right"
        assistiveText={{ icon: i18n.t('User Actions') }}
        buttonClassName="slds-button_icon-x-small"
        buttonVariant="icon"
        iconCategory="utility"
        iconName="down"
        iconSize="small"
        iconVariant="border-filled"
        width="xx-small"
        options={[
          { id: 'edit', label: actions[0] },
          { id: 'remove', label: actions[1] },
        ]}
        onSelect={handleSelect}
      />
    );
  }
  return <Button label={i18n.t('Assign')} onClick={openAssignUserModal} />;
};

const OrgIcon = ({
  orgId,
  ownedByCurrentUser,
  isDeleting,
}: {
  orgId: string;
  ownedByCurrentUser: boolean;
  isDeleting: boolean;
}) => {
  const orgUrl = window.api_urls.scratch_org_redirect(orgId);
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
    return <>{loadingMsg}</>;
  }
  if (org) {
    if (isDeleting) {
      return <>{i18n.t('Deleting Org…')}</>;
    }
    if (ownedByCurrentUser) {
      if (org.currently_capturing_changes) {
        return (
          <>
            {i18n.t('Capturing Selected Changes…')}
            <div className="slds-p-top_small">{loadingMsg}</div>
          </>
        );
      }
      if (org.currently_refreshing_changes) {
        return <>{i18n.t('Checking for Uncaptured Changes…')}</>;
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
  assignedToCurrentUser,
  isCreating,
  isDeleting,
  doCreateAction,
  doDeleteAction,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  assignedToCurrentUser: boolean;
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
  if (!org && assignedToCurrentUser) {
    return <Button label={i18n.t('Create Org')} onClick={doCreateAction} />;
  }
  if (ownedByCurrentUser && !isDeleting) {
    return (
      <Dropdown
        align="right"
        assistiveText={{ icon: i18n.t('Org Actions') }}
        buttonClassName="slds-button_icon-x-small"
        buttonVariant="icon"
        iconCategory="utility"
        iconName="down"
        iconSize="small"
        iconVariant="border-filled"
        width="xx-small"
        options={[{ id: 0, label: i18n.t('Delete Org') }]}
        onSelect={doDeleteAction}
      />
    );
  }
  return null;
};

const OrgInfo = ({
  org,
  ownedByCurrentUser,
  assignedToCurrentUser,
  isCreating,
  type,
  doRefreshAction,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  assignedToCurrentUser: boolean;
  isCreating: boolean;
  type: OrgTypes;
  doRefreshAction: () => void;
}) => {
  if (!org && !assignedToCurrentUser) {
    return (
      <ul>
        <li>
          <strong>{i18n.t('Status')}:</strong> {i18n.t('not yet created')}
        </li>
      </ul>
    );
  }
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
      {type === ORG_TYPES.DEV && (
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

const OrgSpinner = ({
  org,
  ownedByCurrentUser,
  isDeleting,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isDeleting: boolean;
}) => {
  if (
    (org && isDeleting) ||
    (ownedByCurrentUser &&
      (org?.currently_capturing_changes || org?.currently_refreshing_changes))
  ) {
    return <SpinnerWrapper size="small" />;
  }
  return null;
};

const OrgCard = withRouter(
  ({
    orgs,
    type,
    user,
    assignedUser,
    projectUsers,
    projectUrl,
    isCreatingOrg,
    isDeletingOrg,
    assignUserAction,
    createAction,
    deleteAction,
    refreshAction,
    history,
  }: {
    orgs: OrgsByTask;
    type: OrgTypes;
    user: User | null;
    assignedUser: GitHubUser | null;
    projectUsers: GitHubUser[];
    projectUrl: string;
    isCreatingOrg: OrgTypeTracker;
    isDeletingOrg: OrgTypeTracker;
    assignUserAction: ({
      type,
      assignee,
    }: {
      type: OrgTypes;
      assignee: GitHubUser | null;
    }) => void;
    createAction: (type: OrgTypes) => void;
    deleteAction: (org: Org) => void;
    refreshAction: (org: Org) => void;
  } & RouteComponentProps) => {
    const userId = user?.id;
    const username = user?.username;
    const assignedToCurrentUser = Boolean(
      user && username === assignedUser?.login,
    );
    const org = assignedToCurrentUser ? orgs[type] : null;
    const ownedByCurrentUser = Boolean(
      user && org?.url && userId === org.owner,
    );

    const [assignUserModalOpen, setAssignUserModalOpen] = useState(false);
    const openAssignUserModal = () => {
      setAssignUserModalOpen(true);
    };
    const closeAssignUserModal = () => {
      setAssignUserModalOpen(false);
    };

    const doAssignUserAction = useCallback(
      (assignee: GitHubUser | null) => {
        assignUserAction({ type, assignee });
        closeAssignUserModal();
      },
      [assignUserAction, type],
    );
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

    const isCreating = Boolean(isCreatingOrg[type] || (org && !org.url));
    const isDeleting = Boolean(isDeletingOrg[type] || org?.delete_queued_at);
    const heading =
      type === ORG_TYPES.QA ? i18n.t('Reviewer') : i18n.t('Developer');
    const orgHeading =
      type === ORG_TYPES.QA ? i18n.t('Review Org') : i18n.t('Dev Org');
    const userModalHeading =
      type === ORG_TYPES.QA
        ? i18n.t('Assign Reviewer')
        : i18n.t('Assign Developer');

    const handleEmptyMessageClick = useCallback(() => {
      history.push(projectUrl);
    }, [projectUrl]); // eslint-disable-line react-hooks/exhaustive-deps

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
              setUser={doAssignUserAction}
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
          {assignedUser && (
            <>
              <div className="slds-m-bottom_small">
                <UserCard user={assignedUser} className="nested-card" />
              </div>
              <hr className="slds-m-vertical_none" />
              <Card
                className="nested-card"
                bodyClassName="slds-card__body_inner"
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
                    isCreating={isCreating}
                    isDeleting={isDeleting}
                    doCreateAction={doCreateAction}
                    doDeleteAction={doDeleteAction}
                  />
                }
              >
                <OrgInfo
                  org={org}
                  ownedByCurrentUser={ownedByCurrentUser}
                  assignedToCurrentUser={assignedToCurrentUser}
                  isCreating={isCreating}
                  type={type}
                  doRefreshAction={doRefreshAction}
                />
                <OrgSpinner
                  org={org}
                  ownedByCurrentUser={ownedByCurrentUser}
                  isDeleting={isDeleting}
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
          setUser={doAssignUserAction}
        />
      </div>
    );
  },
);

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

  const assignUser = useCallback(
    ({ type, assignee }: { type: OrgTypes; assignee: GitHubUser | null }) => {
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
          user={user}
          assignedUser={task.assigned_dev}
          projectUsers={projectUsers}
          projectUrl={projectUrl}
          isCreatingOrg={isCreatingOrg}
          isDeletingOrg={isDeletingOrg}
          assignUserAction={assignUser}
          createAction={createAction}
          deleteAction={deleteAction}
          refreshAction={doRefetchOrg}
        />
        <OrgCard
          orgs={orgs}
          type={ORG_TYPES.QA}
          user={user}
          assignedUser={task.assigned_qa}
          projectUsers={projectUsers}
          projectUrl={projectUrl}
          isCreatingOrg={isCreatingOrg}
          isDeletingOrg={isDeletingOrg}
          assignUserAction={assignUser}
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
