import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { logout } from '@/store/user/actions';

const Logout = () => {
  const dispatch = useDispatch();
  const doLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);
  return (
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
};

export default Logout;
