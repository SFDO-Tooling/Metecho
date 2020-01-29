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
  isCreating,
  isDeleting,
  doCreateOrg,
  doDeleteOrg,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  assignedToCurrentUser: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  doCreateOrg: () => void;
  doDeleteOrg: () => void;
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
    return <Button label={i18n.t('Create Org')} onClick={doCreateOrg} />;
  }

  if (org && ownedByCurrentUser && !isDeleting) {
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
        onSelect={doDeleteOrg}
      />
    );
  }

  return null;
};

export default OrgActions;
