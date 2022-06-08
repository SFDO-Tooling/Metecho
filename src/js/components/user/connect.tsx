import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import cookies from 'js-cookie';
import React, { useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ExternalLink } from '@/js/components/utils';
import { User } from '@/js/store/user/reducer';

const ConnectModal = ({
  user,
  isOpen,
  toggleModal,
}: {
  user: User;
  isOpen: boolean;
  toggleModal: (open: boolean) => void;
}) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const customDomainSubmitButton = useRef<HTMLButtonElement | null>(null);

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

  const handleCustomDomainChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setUrl(event.target.value);
  };

  const customDomain = url.trim();

  /* istanbul ignore next */
  const handleCustomDomainConnect = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    if (!customDomain) {
      event.preventDefault();
    }
  };

  const isConnected = Boolean(
    user.valid_token_for || user.devhub_username || user.uses_global_devhub,
  );

  const csrftoken = cookies.get('csrftoken');

  /* istanbul ignore next */
  const submitClicked = () => {
    customDomainSubmitButton.current?.click();
  };

  return (
    <Modal
      isOpen={isOpen && !isConnected}
      heading={t('Connect to Salesforce')}
      dismissOnClickOutside={false}
      assistiveText={{ closeButton: t('Close') }}
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
          <Button key="back" label={t('Back')} onClick={closeCustomDomain} />,
          <Button
            key="submit"
            label={t('Continue')}
            variant="brand"
            onClick={submitClicked}
            disabled={!customDomain}
          />,
        ]
      }
      onRequestClose={handleClose}
    >
      {isCustomDomain ? (
        /* POSTing instead of redirecting to the login endpoint is more secure */
        <form
          className="slds-p-around_large"
          action={window.api_urls.salesforce_login?.()}
          method="POST"
          onSubmit={handleCustomDomainConnect}
        >
          <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />
          <input
            type="hidden"
            name="next"
            value={window.location.pathname}
            data-testid="sf-login-custom-domain-next"
          />
          <input
            type="hidden"
            name="custom_domain"
            value={customDomain}
            data-testid="sf-login-custom-domain"
          />
          <input type="hidden" name="process" value="connect" />
          <div className="slds-form-element__help slds-p-bottom_small">
            {t(
              'To go to your company’s login page, enter the custom domain name.',
            )}
          </div>
          <Input
            id="login-custom-domain"
            label={t('Custom Domain')}
            value={url}
            onChange={handleCustomDomainChange}
            aria-describedby="login-custom-domain-help"
          >
            <div
              id="login-custom-domain-help"
              className="slds-form-element__help slds-truncate slds-p-top_small"
              data-testid="custom-domain"
            >
              https://{customDomain || <em>domain</em>}.my.salesforce.com
            </div>
          </Input>
          <button
            ref={customDomainSubmitButton}
            type="submit"
            style={{ display: 'none' }}
            disabled={!customDomain}
          />
        </form>
      ) : (
        <div className="slds-p-around_large">
          {/* POSTing instead of redirecting to the login endpoint is more secure */}
          <form action={window.api_urls.salesforce_login?.()} method="POST">
            <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />
            <input
              type="hidden"
              name="next"
              value={window.location.pathname}
              data-testid="sf-login-next"
            />
            <input type="hidden" name="custom_domain" value="login" />
            <input type="hidden" name="process" value="connect" />
            <Button
              type="submit"
              label={t('Connect to Salesforce')}
              variant="brand"
              className="slds-size_full
                slds-p-vertical_x-small
                slds-m-bottom_large"
            />
          </form>
          <Button
            label={t('Use Custom Domain')}
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
