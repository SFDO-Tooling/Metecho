import * as React from 'react';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';

import CustomDomainModal from 'components/header/customDomainModal';
import { addUrlParams } from 'utils/api';
import { logError } from 'utils/logging';

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

class Login extends React.Component<Props, { modalOpen: boolean }> {
  public static defaultProps = {
    id: 'login',
    buttonClassName: 'slds-button_outline-brand',
    buttonVariant: 'base',
    disabled: false,
    menuPosition: 'overflowBoundaryElement',
    nubbinPosition: 'top right',
  };

  public constructor(props: Props) {
    super(props);
    this.state = { modalOpen: false };
    if (!window.api_urls.salesforce_production_login) {
      logError('Login URL not found for salesforce_production provider.');
    }
    if (!window.api_urls.salesforce_test_login) {
      logError('Login URL not found for salesforce_test provider.');
    }
    if (!window.api_urls.salesforce_custom_login) {
      logError('Login URL not found for salesforce_custom provider.');
    }
  }

  private toggleModal = (isOpen: boolean) => {
    this.setState({ modalOpen: isOpen });
  };

  private handleSelect = (opt: MenuOption | Divider) => {
    if (!isDivider(opt)) {
      if (opt.modal) {
        this.toggleModal(true);
        return;
      }
      if (opt.href) {
        window.location.assign(
          addUrlParams(opt.href, { next: window.location.pathname }),
        );
      }
    }
  };

  private static getMenuOpts(): (MenuOption | Divider)[] {
    return [
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
  }

  public render() {
    const menuOpts = Login.getMenuOpts();
    const {
      id,
      label,
      triggerClassName,
      buttonClassName,
      buttonVariant,
      disabled,
      menuPosition,
      nubbinPosition,
    } = this.props;
    const { modalOpen } = this.state;

    return (
      <>
        <Dropdown
          id={id}
          label={label === undefined ? i18n.t('Log In') : label}
          className="slds-dropdown_actions"
          triggerClassName={triggerClassName}
          buttonClassName={buttonClassName}
          buttonVariant={buttonVariant}
          disabled={disabled}
          menuPosition={menuPosition}
          nubbinPosition={nubbinPosition}
          iconCategory="utility"
          iconName="down"
          iconPosition="right"
          options={menuOpts}
          onSelect={this.handleSelect}
        />
        <CustomDomainModal isOpen={modalOpen} toggleModal={this.toggleModal} />
      </>
    );
  }
}

export default Login;
