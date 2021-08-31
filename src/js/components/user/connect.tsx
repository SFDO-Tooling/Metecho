import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useState } from 'react';
import { Trans } from 'react-i18next';

import { ExternalLink } from '@/js/components/utils';
import { User } from '@/js/store/user/reducer';
import { addUrlParams } from '@/js/utils/api';

const CustomDomainForm = ({
  url,
  setUrl,
  handleCustomDomainConnect,
}: {
  url: string;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
  handleCustomDomainConnect: (event: React.FormEvent<HTMLFormElement>) => void;
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  return (
    <form className="slds-p-around_large" onSubmit={handleCustomDomainConnect}>
      <div className="slds-form-element__help slds-p-bottom_small">
        {i18n.t(
          'To go to your company’s login page, enter the custom domain name.',
        )}
      </div>
      <Input
        id="login-custom-domain"
        label={i18n.t('Custom Domain')}
        value={url}
        onChange={handleChange}
        aria-describedby="login-custom-domain-help"
      >
        <div
          id="login-custom-domain-help"
          className="slds-form-element__help slds-truncate slds-p-top_small"
          data-testid="custom-domain"
        >
          https://
          {url.trim() ? url.trim() : <em>domain</em>}
          .my.salesforce.com
        </div>
      </Input>
    </form>
  );
};

const ConnectModal = ({
  user,
  isOpen,
  toggleModal,
}: {
  user: User;
  isOpen: boolean;
  toggleModal: (open: boolean) => void;
}) => {
  const [url, setUrl] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);

  const handleClose = () => {
    setUrl('');
    setIsCustomDomain(false);
    toggleModal(false);
  };

  const openCustomDomain = () => {
    setIsCustomDomain(true);
  };

  const closeCustomDomain = () => {
    setUrl('');
    setIsCustomDomain(false);
  };

  const handleConnect = () => {
    window.location.assign(
      addUrlParams(window.api_urls.salesforce_login(), {
        custom_domain: 'login',
        process: 'connect',
        next: window.location.pathname,
      }),
    );
  };

  const handleCustomDomainConnect = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const val = url.trim();
    if (!val) {
      return;
    }
    const baseUrl = window.api_urls.salesforce_login();
    window.location.assign(
      addUrlParams(baseUrl, {
        custom_domain: val,
        process: 'connect',
        next: window.location.pathname,
      }),
    );
  };

  const isConnected = Boolean(
    user.valid_token_for || user.devhub_username || user.uses_global_devhub,
  );

  return (
    <Modal
      isOpen={isOpen && !isConnected}
      heading={i18n.t('Connect to Salesforce')}
      assistiveText={{ closeButton: i18n.t('Close') }}
      tagline={
        <Trans i18nKey="devHubInfo">
          Connection to a Salesforce Org with Dev Hub enabled is required to
          create a Dev, Test, or Scratch Org. Learn how to{' '}
          <ExternalLink url="https://developer.salesforce.com/signup">
            create a Developer Edition Org
          </ExternalLink>{' '}
          and{' '}
          <ExternalLink url="https://help.salesforce.com/articleView?id=sfdx_setup_enable_devhub.htm&type=0">
            enable Dev Hub
          </ExternalLink>
          .
        </Trans>
      }
      footer={
        isCustomDomain && [
          <Button
            key="back"
            label={i18n.t('Back')}
            onClick={closeCustomDomain}
          />,
          <Button
            key="submit"
            label={i18n.t('Continue')}
            variant="brand"
            onClick={handleCustomDomainConnect}
          />,
        ]
      }
      onRequestClose={handleClose}
    >
      {isCustomDomain ? (
        <CustomDomainForm
          url={url}
          setUrl={setUrl}
          handleCustomDomainConnect={handleCustomDomainConnect}
        />
      ) : (
        <div className="slds-p-around_large">
          <Button
            label={i18n.t('Connect to Salesforce')}
            variant="brand"
            className="slds-size_full
              slds-p-vertical_x-small
              slds-m-bottom_large"
            onClick={handleConnect}
          />
          <Button
            label={i18n.t('Use Custom Domain')}
            variant="outline-brand"
            className="slds-size_full slds-p-vertical_x-small slds-m-left_none"
            onClick={openCustomDomain}
          />
        </div>
      )}
    </Modal>
  );
};

export default ConnectModal;
