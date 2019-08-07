import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useState } from 'react';

import { addUrlParams } from '@/utils/api';

interface Props {
  isOpen: boolean;
  toggleModal: (open: boolean) => void;
}

const CustomDomainModal = ({ isOpen, toggleModal }: Props) => {
  const [url, setUrl] = useState('');
  const [org, setOrg] = useState('dev');

  const handleClose = () => {
    setUrl('');
    setOrg('dev');
    toggleModal(false);
  };

  const goBack = () => {
    setOrg('dev');
  };

  const handleAction = () => {
    return org === 'custom' ? goBack() : handleClose();
  };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (org === 'custom') {
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
    }
    if (org === 'dev') {
      console.log('login to devOrg');
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const heading: any = {
    dev: i18n.t('Connect to Salesforce DevHub'),
    custom: i18n.t('Use Custom Domain'),
  };
  const label: any = {
    dev: i18n.t('Cancel'),
    custom: i18n.t('Back'),
  };

  return (
    <Modal
      isOpen={isOpen}
      heading={heading[org]}
      onRequestClose={handleClose}
      footer={[
        <Button key="cancel" label={label[org]} onClick={handleAction} />,
        <Button
          key="submit"
          label={i18n.t('Continue')}
          variant="brand"
          onClick={handleSubmit}
        />,
      ]}
    >
      {org === 'custom' && (
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
      )}
      {org === 'dev' && (
        <div className="slds-p-around_large">
          <Button
            label={i18n.t('Log into Developer Edition Org with DevHub')}
            variant="brand"
            style={{ width: `100%` }}
            onClick={handleSubmit}
          />
          <Button
            label={i18n.t('Log into Custom Org with DevHub')}
            variant="outline-brand"
            style={{ width: `100%` }}
            onClick={() => setOrg('custom')}
          />
        </div>
      )}
    </Modal>
  );
};

export default CustomDomainModal;
