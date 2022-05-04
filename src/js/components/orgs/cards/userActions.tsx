import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ORG_TYPES, OrgTypes } from '@/js/utils/constants';

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
  openAssignUserModal: (orgType: OrgTypes) => void;
  setUser: (user: string | null, shouldAlertAssignee: boolean) => void;
}) => {
  const { t } = useTranslation();

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
          ? [t('Change Tester'), t('Remove Tester')]
          : [t('Change Developer'), t('Remove Developer')];
      options = [
        { id: 'edit', label: actionLabels[0] },
        { id: 'remove', label: actionLabels[1] },
      ];
    } else if (assignedUserId === currentUserId) {
      options = [{ id: 'remove', label: t('Remove Tester') }];
    } else {
      return null;
    }

    return (
      <Dropdown
        align="right"
        assistiveText={{ icon: t('User Actions') }}
        buttonClassName="slds-button_icon-x-small"
        buttonVariant="icon"
        iconCategory="utility"
        iconName="down"
        iconSize="small"
        iconVariant="border-filled"
        triggerClassName="metecho-card-more"
        width="xx-small"
        options={options}
        onSelect={handleSelect}
      />
    );
  }

  /* istanbul ignore else */
  if (userHasPermissions) {
    return <Button label={t('Assign')} onClick={openAssignUserModal} />;
  } else if (type === ORG_TYPES.QA && currentUserId) {
    return (
      <Button
        label={t('Self-Assign')}
        onClick={() => setUser(currentUserId, false)}
      />
    );
  }
  /* istanbul ignore next */
  return null;
};

export default UserActions;
