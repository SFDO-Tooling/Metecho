import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React from 'react';

import { GitHubUser } from '@/store/user/reducer';
import { ORG_TYPES, OrgTypes } from '@/utils/constants';

const UserActions = ({
  type,
  assignedUser,
  openAssignUserModal,
  setUser,
}: {
  type: OrgTypes;
  assignedUser: GitHubUser | null;
  openAssignUserModal: (type: OrgTypes) => void;
  setUser: (user: GitHubUser | null, shouldAlertAssignee: boolean) => void;
}) => {
  if (assignedUser) {
    const handleSelect = (option: { id: string; label: string }) => {
      switch (option.id) {
        /* istanbul ignore next */
        case 'edit':
          openAssignUserModal(type);
          break;
        case 'remove':
          setUser(null, false);
          break;
      }
    };

    const actionLabels =
      type === ORG_TYPES.QA
        ? [i18n.t('Change Tester'), i18n.t('Remove Tester')]
        : [i18n.t('Change Developer'), i18n.t('Remove Developer')];

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
          { id: 'edit', label: actionLabels[0] },
          { id: 'remove', label: actionLabels[1] },
        ]}
        onSelect={handleSelect}
      />
    );
  }

  return <Button label={i18n.t('Assign')} onClick={openAssignUserModal} />;
};

export default UserActions;
