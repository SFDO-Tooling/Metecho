import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React from 'react';

const Logout = ({ doLogout }: { doLogout(): Promise<any> }) => (
  <Button
    label={i18n.t('Log Out')}
    variant="link"
    className="slds-m-left_x-large"
    iconCategory="utility"
    iconName="logout"
    iconPosition="left"
    onClick={doLogout}
  />
);

export default Logout;
