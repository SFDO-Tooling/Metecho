import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Icon from '@salesforce/design-system-react/components/icon';
import { format, formatDistanceToNow } from 'date-fns';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import ConnectModal from '@/components/user/connect';
import { ConnectionInfoModal } from '@/components/user/info';
import {
  ExternalLink,
  LabelWithSpinner,
  useIsMounted,
} from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { createObject } from '@/store/actions';
import { Org, OrgsByTask } from '@/store/orgs/reducer';
import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { OBJECT_TYPES, ORG_TYPES, OrgTypes } from '@/utils/constants';

const OrgCard = ({
  org,
  type,
  displayType,
  ownedByCurrentUser,
  user,
  createOrg,
  isCreatingOrg,
  toggleConnectModal,
  toggleInfoModal,
}: {
  org: Org | null;
  type: OrgTypes;
  displayType: string;
  ownedByCurrentUser: boolean;
  user: User;
  createOrg: (type: OrgTypes) => void;
  isCreatingOrg: OrgTypes | null;
  toggleConnectModal: React.Dispatch<React.SetStateAction<boolean>>;
  toggleInfoModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const doCreateOrg = useCallback(() => {
    createOrg(type);
  }, [createOrg, type]);
  const openConnectModal = () => {
    toggleConnectModal(true);
  };
  const openInfoModal = () => {
    toggleInfoModal(true);
  };
  let action = openConnectModal;
  if (user.valid_token_for) {
    action = user.is_devhub_enabled ? doCreateOrg : openInfoModal;
  }
  const isCreating = isCreatingOrg === type || (org && !org.url);
  let contents = null;
  let icon = null;
  if (isCreating) {
    contents = i18n.t('This process could take up to 15 minutes.');
  } else if (org) {
    const lastModifiedAt =
      org.last_modified_at && new Date(org.last_modified_at);
    const expiresAt = org.expires_at && new Date(org.expires_at);
    const changesMsg = org.has_changes
      ? i18n.t('Has uncaptured changes')
      : i18n.t('All changes captured');
    contents = (
      <ul>
        {lastModifiedAt && (
          <li>
            <strong>{i18n.t('Last Modified')}:</strong>{' '}
            <span title={format(lastModifiedAt, 'PPpp')}>
              {formatDistanceToNow(lastModifiedAt, { addSuffix: true })}
            </span>
            {org.latest_commit && org.latest_commit_url && (
              <>
                {' ('}
                <ExternalLink url={org.latest_commit_url}>
                  {org.latest_commit.substring(0, 7)}
                </ExternalLink>
                {')'}
              </>
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
        <li>
          <Icon
            category="utility"
            name={org.has_changes ? 'warning' : 'check'}
            size="x-small"
            className="slds-m-bottom_xx-small slds-m-right_xx-small"
          />
          {changesMsg}
        </li>
      </ul>
    );
    if (ownedByCurrentUser && org.url) {
      icon = (
        <ExternalLink url={org.url} title={i18n.t('View Org')}>
          <Icon
            category="utility"
            name="link"
            size="small"
            className="icon-link"
          />
        </ExternalLink>
      );
    } else {
      icon = <Icon category="utility" name="link" size="small" />;
    }
  }
  return (
    <div
      className="slds-size_1-of-1
        slds-large-size_1-of-2
        slds-p-around_x-small"
    >
      <Card
        bodyClassName="slds-card__body_inner"
        icon={icon}
        heading={displayType}
        headerActions={
          (isCreating || !org) && (
            <Button
              label={
                isCreating ? (
                  <LabelWithSpinner label={i18n.t('Creating Org…')} />
                ) : (
                  i18n.t('Create Org')
                )
              }
              disabled={isCreating}
              onClick={action}
            />
          )
        }
        footer={
          org &&
          org.url &&
          ownedByCurrentUser && (
            <ExternalLink url={org.url}>{i18n.t('View Org')}</ExternalLink>
          )
        }
      >
        {contents}
      </Card>
    </div>
  );
};

const OrgCards = ({
  orgs,
  task,
  project,
}: {
  orgs: OrgsByTask;
  task: Task;
  project: Project;
}) => {
  const user = useSelector(selectUserState);
  const isMounted = useIsMounted();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState<OrgTypes | null>(null);
  const dispatch = useDispatch<ThunkDispatch>();
  const createOrg = useCallback((type: OrgTypes) => {
    setIsCreatingOrg(type);
    // Subscribe to project/task for possible branch creation...
    if (window.socket) {
      /* istanbul ignore else */
      if (!project.branch_url) {
        window.socket.subscribe({
          model: OBJECT_TYPES.PROJECT,
          id: project.id,
        });
      }
      /* istanbul ignore else */
      if (!task.branch_url) {
        window.socket.subscribe({
          model: OBJECT_TYPES.TASK,
          id: task.id,
        });
      }
    }
    dispatch(
      createObject({
        objectType: OBJECT_TYPES.ORG,
        // eslint-disable-next-line @typescript-eslint/camelcase
        data: { task: task.id, org_type: type },
        shouldSubscribeToObject: (object: Org) => object && !object.url,
      }),
    ).finally(() => {
      /* istanbul ignore else */
      if (isMounted.current) {
        setIsCreatingOrg(null);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const devOrg = orgs[ORG_TYPES.DEV];
  const qaOrg = orgs[ORG_TYPES.QA];
  const currentUserOwnsDevOrg = Boolean(
    user && devOrg && devOrg.url && user.id === devOrg.owner,
  );
  const currentUserOwnsQAOrg = Boolean(
    user && qaOrg && qaOrg.url && user.id === qaOrg.owner,
  );

  return (
    <>
      <h2 className="slds-text-heading_medium">{i18n.t('Task Orgs')}</h2>
      <div className="slds-grid slds-wrap slds-grid_pull-padded-x-small">
        <OrgCard
          org={devOrg}
          type={ORG_TYPES.DEV}
          displayType={i18n.t('Dev')}
          ownedByCurrentUser={currentUserOwnsDevOrg}
          user={user as User}
          createOrg={createOrg}
          isCreatingOrg={isCreatingOrg}
          toggleConnectModal={setConnectModalOpen}
          toggleInfoModal={setInfoModalOpen}
        />
        <OrgCard
          org={qaOrg}
          type={ORG_TYPES.QA}
          displayType={i18n.t('QA')}
          ownedByCurrentUser={currentUserOwnsQAOrg}
          user={user as User}
          createOrg={createOrg}
          isCreatingOrg={isCreatingOrg}
          toggleConnectModal={setConnectModalOpen}
          toggleInfoModal={setInfoModalOpen}
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
      />
    </>
  );
};

export default OrgCards;
