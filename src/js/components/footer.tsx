import Button from '@salesforce/design-system-react/components/button';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { TermsModal } from '@/js/components/terms';
import { selectUserState } from '@/js/store/user/selectors';

const Footer = ({ logoSrc }: { logoSrc: string }) => {
  const { t } = useTranslation();
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
  const showTermsModal = Boolean(window.GLOBALS?.SITE?.clickthrough_agreement);
  const currentYear = new Date().getFullYear();

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
          {t(
            'Copyright 2019–{{current_year}} Salesforce.org. All rights reserved.',
            { current_year: currentYear },
          )}
        </p>
        {showTermsModal && (
          <>
            <Button
              label={t('Terms of Service')}
              variant="link"
              className="slds-p-left_xxx-small"
              onClick={openTermsModal}
            />
            <TermsModal isOpen={termsModalOpen} handleClose={closeTermsModal} />
          </>
        )}
      </div>
    </footer>
  );
};

export default Footer;
