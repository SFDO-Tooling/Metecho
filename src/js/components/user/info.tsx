import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import DropdownTrigger from '@salesforce/design-system-react/components/menu-dropdown/button-trigger';
import i18n from 'i18next';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import ConnectModal from '@/components/user/connect';
import { selectUserState } from '@/store/user/selectors';

const UserInfo = () => {
  const user = useSelector(selectUserState);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelect = () => {
    setModalOpen(true);
  };

  return (
    <>
      <Dropdown
        className="slds-dropdown_actions"
        options={[{ label: i18n.t('Connect to a Salesforce Org') }]}
        menuPosition="overflowBoundaryElement"
        nubbinPosition="top right"
        onSelect={handleSelect}
      >
        <DropdownTrigger>
          <Button variant="base">
            <Avatar />
            <span className="slds-p-left_small">{user && user.username}</span>
            <Icon category="utility" name="down" size="x-small" />
          </Button>
        </DropdownTrigger>
      </Dropdown>
      <ConnectModal isOpen={modalOpen} toggleModal={setModalOpen} />
    </>
  );
};

export default UserInfo;
