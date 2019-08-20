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

import { ExternalLink, useIsMounted } from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { createObject } from '@/store/actions';
import { Org, OrgsByTask } from '@/store/orgs/reducer';
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
  children,
  createOrg,
  isCreatingOrg,
  ...props
}: DataCellProps & {
  createOrg: (type: OrgTypes) => void;
  isCreatingOrg: OrgTypes | null;
}) => {
  const doCreateOrg = useCallback(() => {
    createOrg((item as Item).org_type);
  }, [createOrg, item]);
  let icon;
  const isCreating = item && isCreatingOrg === item.org_type;
  if (isCreating) {
    icon = (
      <span className="slds-is-relative slds-m-horizontal_x-small">
        <Spinner size="x-small" />
      </span>
    );
  } else if (item && !item.isNull) {
    if (item.ownedByCurrentUser && item.url) {
      icon = (
        <ExternalLink url={item.url}>
          <Icon
            title={i18n.t('View Org')}
            category="utility"
            name="link"
            size="xx-small"
            className="icon-link slds-m-bottom_xxx-small"
          />
        </ExternalLink>
      );
    } else {
      icon = <Icon category="utility" name="link" size="xx-small" />;
    }
  } else {
    icon = (
      <Button
        title={i18n.t('Create New Org')}
        iconCategory="utility"
        iconName="add"
        iconClassName="slds-m-bottom_xxx-small"
        variant="icon"
        onClick={doCreateOrg}
      />
    );
  }
  return (
    <DataTableCell
      title={isCreating ? i18n.t('Creating Org…') : item && item.displayType}
      {...props}
    >
      {icon}
      <span className="slds-m-left_x-small">{children}</span>
    </DataTableCell>
  );
};
TypeDataCell.displayName = DataTableCell.displayName;

const AccessOrgCell = ({ item, ...props }: DataCellProps) =>
  item && !item.isNull && item.url ? (
    <DataTableCell title={i18n.t('View Org')} {...props}>
      <ExternalLink url={item.url}>
        <Button label={i18n.t('View Org')} variant="link" />
      </ExternalLink>
    </DataTableCell>
  ) : (
    <DataTableCell {...props}>
      <EmptyIcon />
    </DataTableCell>
  );
AccessOrgCell.displayName = DataTableCell.displayName;

const LastModifiedTableCell = ({ item, ...props }: DataCellProps) => {
  if (!item || item.isNull || !item.last_modified_at) {
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
            {item.latest_commit}
          </ExternalLink>
          {')'}
        </>
      )}
    </DataTableCell>
  );
};
LastModifiedTableCell.displayName = DataTableCell.displayName;

const ExpirationDataCell = ({ item, ...props }: DataCellProps) => {
  if (!item || item.isNull || !item.expires_at) {
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
  if (item && !item.isNull) {
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

const OrgsTable = ({ orgs, task }: { orgs: OrgsByTask; task: string }) => {
  const user = useSelector(selectUserState);
  const isMounted = useIsMounted();
  const [isCreatingOrg, setIsCreatingOrg] = useState<OrgTypes | null>(null);
  const dispatch = useDispatch<ThunkDispatch>();
  const createOrg = useCallback((type: OrgTypes) => {
    setIsCreatingOrg(type);
    dispatch(
      createObject({
        objectType: OBJECT_TYPES.ORG,
        // eslint-disable-next-line @typescript-eslint/camelcase
        data: { task, org_type: type },
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
  const currentUserOwnsDevOrg = user && devOrg && user.id === devOrg.owner;
  const currentUserOwnsQAOrg = user && qaOrg && user.id === qaOrg.owner;
  /* eslint-disable @typescript-eslint/camelcase */
  const items = [
    {
      displayType: i18n.t('Dev'),
      ownedByCurrentUser: currentUserOwnsDevOrg,
      id: ORG_TYPES.DEV,
      isNull: devOrg === null,
      ...devOrg,
    },
    {
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
          <TypeDataCell createOrg={createOrg} isCreatingOrg={isCreatingOrg} />
        </DataTableColumn>
        {(currentUserOwnsDevOrg || currentUserOwnsQAOrg) && (
          <DataTableColumn key="url" property="url">
            <AccessOrgCell />
          </DataTableColumn>
        )}
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
    </>
  );
};

export default OrgsTable;
