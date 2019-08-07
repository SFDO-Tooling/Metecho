import i18n from 'i18next';
import React, { useState } from 'react';

import CustomDomainModal from '@/components/user/customDomainModal';
import { addUrlParams } from '@/utils/api';

interface Props {
  id: string;
  label?: string | React.ReactElement;
  buttonClassName: string;
  buttonVariant: string;
  triggerClassName?: string;
  disabled: boolean;
  menuPosition: string;
  nubbinPosition: string;
}
interface Divider {
  type: 'divider';
}
interface MenuOption {
  label: string;
  href?: string;
  disabled: boolean;
  modal?: boolean;
}

const isDivider = (opt: MenuOption | Divider): opt is Divider =>
  (opt as Divider).type === 'divider';

const getMenuOpts = (): (MenuOption | Divider)[] => [
  {
    label: i18n.t('Production or Developer Org'),
    href:
      window.api_urls.salesforce_production_login &&
      window.api_urls.salesforce_production_login(),
    disabled: !window.api_urls.salesforce_production_login,
  },
  {
    label: i18n.t('Sandbox or Scratch Org'),
    href:
      window.api_urls.salesforce_test_login &&
      window.api_urls.salesforce_test_login(),
    disabled: !window.api_urls.salesforce_test_login,
  },
  {
    type: 'divider',
  },
  {
    label: i18n.t('Use Custom Domain'),
    modal: Boolean(window.api_urls.salesforce_custom_login),
    disabled: !window.api_urls.salesforce_custom_login,
  },
];

const Login = ({
  id,
  label,
  buttonClassName,
  buttonVariant,
  triggerClassName,
  disabled,
  menuPosition,
  nubbinPosition,
}: Props) => {
  const [modalOpen, setModalOpen] = useState(false);

  const toggleModal = (isOpen: boolean) => {
    setModalOpen(isOpen);
  };
  /* @@@ comment out in case still needed */
  // const handleSelect = (opt: MenuOption | Divider) => {
  //   /* istanbul ignore else */
  //   if (!isDivider(opt)) {
  //     if (opt.modal) {
  //       toggleModal(true);
  //       return;
  //     }
  //     if (opt.href) {
  //       window.location.assign(
  //         addUrlParams(opt.href, { next: window.location.pathname }),
  //       );
  //     }
  //   }
  // };

  return (
    <>
      <a onClick={() => toggleModal(true)}>Salesforce DevHub</a>
      <CustomDomainModal isOpen={modalOpen} toggleModal={toggleModal} />
    </>
  );
};

Login.defaultProps = {
  id: 'login',
  buttonClassName: 'slds-button_outline-brand',
  buttonVariant: 'base',
  disabled: false,
  menuPosition: 'overflowBoundaryElement',
  nubbinPosition: 'top right',
};

export default Login;
