import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import Terms from '@/components/terms';
import { selectUserState } from '@/store/user/selectors';

const Footer = ({ logoSrc }: { logoSrc: string }) => {
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const user = useSelector(selectUserState);
  if (!user) {
    return null;
  }
  const openTermsModal = () => {
    setTermsModalOpen(true);
  };
  const closeTermsModal = () => {
    setTermsModalOpen(false);
  };
  return (
    <footer
      className="slds-grid
        slds-grid--align-spread
        slds-grid_vertical-align-center
        slds-wrap
        slds-p-horizontal_x-large
        slds-p-vertical_medium
        slds-text-body_small
        site-contentinfo"
    >
      <div
        className="footer-logo footer-item slds-m-right_medium slds-grow"
        style={{ backgroundImage: `url(${logoSrc})` }}
        data-testid="footer-logo"
      />
      <div className="footer-item slds-grid">
        <p>
          {i18n.t('Copyright 2019–2020 Salesforce.org. All rights reserved.')}
        </p>
        <Button
          label={i18n.t('Terms of Service')}
          variant="link"
          onClick={openTermsModal}
        />
        {termsModalOpen && (
          <Terms reviewTerms={termsModalOpen} handleClose={closeTermsModal} />
        )}
      </div>
    </footer>
  );
};

export default Footer;
