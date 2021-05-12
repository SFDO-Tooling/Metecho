import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React from 'react';

import { ORG_TYPES, OrgTypes } from '~js/utils/constants';

const UserActions = ({
  type,
  assignedUserId,
  currentUserId,
  userHasPermissions,
  openAssignUserModal,
  setUser,
}: {
  type: OrgTypes;
  assignedUserId: string | null;
  currentUserId: string | null;
  userHasPermissions: boolean;
  openAssignUserModal: (t: OrgTypes) => void;
  setUser: (user: string | null, shouldAlertAssignee: boolean) => void;
}) => {
  if (assignedUserId) {
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

    let options: { id: string; label: string }[] = [];
    if (userHasPermissions) {
      const actionLabels =
        type === ORG_TYPES.QA
          ? [i18n.t('Change Tester'), i18n.t('Remove Tester')]
          : [i18n.t('Change Developer'), i18n.t('Remove Developer')];
      options = [
        { id: 'edit', label: actionLabels[0] },
        { id: 'remove', label: actionLabels[1] },
      ];
    } else if (assignedUserId === currentUserId) {
      options = [{ id: 'remove', label: i18n.t('Remove Tester') }];
    } else {
      return null;
    }

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
        options={options}
        onSelect={handleSelect}
      />
    );
  }

  if (userHasPermissions) {
    return <Button label={i18n.t('Assign')} onClick={openAssignUserModal} />;
  } /* istanbul ignore else */ else if (
    type === ORG_TYPES.QA &&
    currentUserId
  ) {
    return (
      <Button
        label={i18n.t('Self-Assign')}
        onClick={() => setUser(currentUserId, false)}
      />
    );
  }
  /* istanbul ignore next */
  return null;
};

export default UserActions;
