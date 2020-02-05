import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React from 'react';

import { LabelWithSpinner } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';

const OrgActions = ({
  org,
  ownedByCurrentUser,
  assignedToCurrentUser,
  ownedByWrongUser,
  reviewOrgOutOfDate,
  isCreating,
  isDeleting,
  isRefreshingOrg,
  doCreateOrg,
  doDeleteOrg,
  doRefreshOrg,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  assignedToCurrentUser: boolean;
  ownedByWrongUser: Org | null;
  reviewOrgOutOfDate: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isRefreshingOrg: boolean;
  doCreateOrg: () => void;
  doDeleteOrg: () => void;
  doRefreshOrg: () => void;
}) => {
  if (isCreating) {
    return (
      <Button
        label={<LabelWithSpinner label={i18n.t('Creating Org…')} />}
        disabled
      />
    );
  }

  if (isRefreshingOrg) {
    return (
      <Button
        label={<LabelWithSpinner label={i18n.t('Refreshing Org…')} />}
        disabled
      />
    );
  }

  if (!isDeleting && (ownedByWrongUser || (org && ownedByCurrentUser))) {
    return (
      <>
        {reviewOrgOutOfDate && ownedByCurrentUser && (
          <Button
            label={i18n.t('Refresh Org')}
            variant="brand"
            className="slds-m-right_small"
            onClick={doRefreshOrg}
          />
        )}
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
          onSelect={doDeleteOrg}
        />
      </>
    );
  }

  if (!org && assignedToCurrentUser) {
    return <Button label={i18n.t('Create Org')} onClick={doCreateOrg} />;
  }

  return null;
};

export default OrgActions;
