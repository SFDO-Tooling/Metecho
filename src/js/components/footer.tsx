import i18n from 'i18next';
import React from 'react';
import { useSelector } from 'react-redux';

import { selectUserState } from '@/store/user/selectors';

const Footer = ({ logoSrc }: { logoSrc: string }) => {
  const user = useSelector(selectUserState);
  if (!user) {
    return null;
  }
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
        <p>{i18n.t('Copyright 2019 Salesforce.org. All rights reserved.')}</p>
      </div>
    </footer>
  );
};

export default Footer;
