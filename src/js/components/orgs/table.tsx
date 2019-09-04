import Button from '@salesforce/design-system-react/components/button';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import Spinner from '@salesforce/design-system-react/components/spinner';
import { format, formatDistanceToNow } from 'date-fns';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import ConnectModal from '@/components/user/connect';
import { ConnectionInfoModal } from '@/components/user/info';
import { ExternalLink, useIsMounted } from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { createObject } from '@/store/actions';
import { Org, OrgsByTask } from '@/store/orgs/reducer';
import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { OBJECT_TYPES, ORG_TYPES, OrgTypes } from '@/utils/constants';

interface Item extends Org {
  displayType: OrgTypes;
  ownedByCurrentUser: boolean;
  isNull: boolean;
}

interface DataCellProps {
  [key: string]: any;
  item?: Item;
}

const EmptyIcon = () => (
  <Icon category="utility" name="dash" size="xx-small" colorVariant="light" />
);

const TypeDataCell = ({
  item,
  user,
  createOrg,
  isCreatingOrg,
  toggleConnectModal,
  toggleInfoModal,
  ...props
}: DataCellProps & {
  user: User;
  createOrg: (type: OrgTypes) => void;
  isCreatingOrg: OrgTypes | null;
  toggleConnectModal: React.Dispatch<React.SetStateAction<boolean>>;
  toggleInfoModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const doCreateOrg = useCallback(() => {
    createOrg((item as Item).org_type);
  }, [createOrg, item]);
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
  let contents;
  const displayType = (
    <span className="slds-m-left_x-small">{item && item.displayType}</span>
  );
  const isCreating =
    item && (isCreatingOrg === item.org_type || (!item.isNull && !item.url));
  if (isCreating) {
    contents = (
      <>
        <span className="slds-is-relative slds-m-horizontal_x-small">
          <Spinner size="x-small" />
        </span>
        {displayType}
      </>
    );
  } else if (item && !item.isNull) {
    if (item.ownedByCurrentUser && item.url) {
      contents = (
        <ExternalLink url={item.url} title={i18n.t('View Org')}>
          <Icon
            category="utility"
            name="link"
            size="xx-small"
            className="icon-link slds-m-bottom_xxx-small"
          />
          {displayType}
        </ExternalLink>
      );
    } else {
      contents = (
        <>
          <Icon category="utility" name="link" size="xx-small" />
          {displayType}
        </>
      );
    }
  } else {
    contents = (
      <>
        <Button
          title={i18n.t('Create New Org')}
          iconCategory="utility"
          iconName="add"
          iconClassName="slds-m-bottom_xxx-small"
          variant="icon"
          onClick={action}
        />
        {displayType}
      </>
    );
  }
  return (
    <DataTableCell
      title={isCreating ? i18n.t('Creating Org…') : item && item.displayType}
      {...props}
    >
      {contents}
    </DataTableCell>
  );
};
TypeDataCell.displayName = DataTableCell.displayName;

const LastModifiedTableCell = ({ item, ...props }: DataCellProps) => {
  if (!item || item.isNull || !item.last_modified_at || !item.url) {
    return (
      <DataTableCell {...props}>
        <EmptyIcon />
      </DataTableCell>
    );
  }
  const date = new Date(item.last_modified_at);
  return (
    <DataTableCell title={format(date, 'PPpp')} {...props}>
      {formatDistanceToNow(date, { addSuffix: true })}
      {item.latest_commit && item.latest_commit_url && (
        <>
          {' ('}
          <ExternalLink url={item.latest_commit_url}>
            {item.latest_commit.substring(0, 7)}
          </ExternalLink>
          {')'}
        </>
      )}
    </DataTableCell>
  );
};
LastModifiedTableCell.displayName = DataTableCell.displayName;

const ExpirationDataCell = ({ item, ...props }: DataCellProps) => {
  if (!item || item.isNull || !item.expires_at || !item.url) {
    return (
      <DataTableCell {...props}>
        <EmptyIcon />
      </DataTableCell>
    );
  }
  const date = new Date(item.expires_at);
  return (
    <DataTableCell title={format(date, 'PPpp')} {...props}>
      {formatDistanceToNow(date, { addSuffix: true })}
    </DataTableCell>
  );
};
ExpirationDataCell.displayName = DataTableCell.displayName;

const StatusTableCell = ({ item, ...props }: DataCellProps) => {
  if (item && !item.isNull && item.url) {
    const title = item.has_changes
      ? i18n.t('Has uncaptured changes')
      : i18n.t('All changes captured');
    return (
      <DataTableCell title={title} {...props}>
        <Icon
          category="utility"
          name={item.has_changes ? 'warning' : 'check'}
          size="xx-small"
          className="slds-m-bottom_xx-small"
        />
      </DataTableCell>
    );
  }
  return (
    <DataTableCell {...props}>
      <EmptyIcon />
    </DataTableCell>
  );
};
StatusTableCell.displayName = DataTableCell.displayName;

const OrgsTable = ({
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
  /* eslint-disable @typescript-eslint/camelcase */
  const items = [
    {
      org_type: ORG_TYPES.DEV,
      displayType: i18n.t('Dev'),
      ownedByCurrentUser: currentUserOwnsDevOrg,
      id: ORG_TYPES.DEV,
      isNull: devOrg === null,
      ...devOrg,
    },
    {
      org_type: ORG_TYPES.QA,
      displayType: i18n.t('QA'),
      ownedByCurrentUser: currentUserOwnsQAOrg,
      id: ORG_TYPES.QA,
      isNull: qaOrg === null,
      ...qaOrg,
    },
  ];
  /* eslint-enable @typescript-eslint/camelcase */
  return (
    <>
      <h2 className="slds-text-heading_medium slds-m-bottom_small">
        {i18n.t('Task Orgs')}
      </h2>
      <DataTable items={items} id="task-orgs-table" noRowHover>
        <DataTableColumn
          key="displayType"
          label={i18n.t('Type')}
          property="displayType"
          primaryColumn
        >
          <TypeDataCell
            user={user as User}
            createOrg={createOrg}
            isCreatingOrg={isCreatingOrg}
            toggleConnectModal={setConnectModalOpen}
            toggleInfoModal={setInfoModalOpen}
          />
        </DataTableColumn>
        <DataTableColumn
          key="last_modified_at"
          label={i18n.t('Last Modified')}
          property="last_modified_at"
        >
          <LastModifiedTableCell />
        </DataTableColumn>
        <DataTableColumn
          key="expires_at"
          label={i18n.t('Expires')}
          property="expires_at"
        >
          <ExpirationDataCell />
        </DataTableColumn>
        <DataTableColumn
          key="status"
          label={i18n.t('Status')}
          property="has_changes"
        >
          <StatusTableCell />
        </DataTableColumn>
      </DataTable>
      <ConnectModal
        isOpen={!(user && user.valid_token_for) && connectModalOpen}
        toggleModal={setConnectModalOpen}
      />
      <ConnectionInfoModal
        user={user as User}
        isOpen={Boolean(
          user &&
            user.valid_token_for &&
            !user.is_devhub_enabled &&
            infoModalOpen,
        )}
        toggleModal={setInfoModalOpen}
      />
    </>
  );
};

export default OrgsTable;
