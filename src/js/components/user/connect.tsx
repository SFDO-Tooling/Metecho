import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useState } from 'react';
import { Trans } from 'react-i18next';

import { ExternalLink } from '@/components/utils';
import { addUrlParams } from '@/utils/api';

const CustomDomainForm = ({
  url,
  setUrl,
}: {
  url: string;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const val = url.trim();
    if (!val) {
      return;
    }
    const baseUrl = window.api_urls.salesforce_custom_login();
    window.location.assign(
      addUrlParams(baseUrl, {
        custom_domain: val, // eslint-disable-line @typescript-eslint/camelcase
        next: window.location.pathname,
      }),
    );
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  return (
    <form className="slds-p-around_large" onSubmit={handleSubmit}>
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

const CustomDomainModal = ({
  isOpen,
  toggleModal,
}: {
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

  const handleSubmit = () => {
    window.location.assign(
      addUrlParams(window.api_urls.salesforce_production_login(), {
        next: window.location.pathname,
      }),
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      heading={
        isCustomDomain
          ? i18n.t('Use Custom Domain')
          : i18n.t('Connect to a Salesforce Org')
      }
      tagline={
        !isCustomDomain && (
          <Trans>
            Learn how to{' '}
            <ExternalLink url="#@@@">
              create a Developer Edition org
            </ExternalLink>{' '}
            and <ExternalLink url="#@@@">enable Dev Hub</ExternalLink>.
          </Trans>
        )
      }
      footer={
        isCustomDomain && [
          <Button
            key="back"
            label={i18n.t('Back')}
            onClick={closeCustomDomain}
          />,
          <Button key="submit" label={i18n.t('Continue')} variant="brand" />,
        ]
      }
      onRequestClose={handleClose}
    >
      {isCustomDomain ? (
        <CustomDomainForm url={url} setUrl={setUrl} />
      ) : (
        <div className="slds-p-around_large">
          <Button
            label={i18n.t('Connect to Salesforce Org')}
            variant="brand"
            className="slds-size_full
              slds-p-vertical_x-small
              slds-m-bottom_large"
            onClick={handleSubmit}
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

export default CustomDomainModal;
