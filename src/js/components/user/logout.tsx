import Button from '@salesforce/design-system-react/components/button';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '@/js/store';
import { logout } from '@/js/store/user/actions';

const Logout = (props: any) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch>();
  const doLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return (
    <Button label={t('Log Out')} variant="link" onClick={doLogout} {...props} />
  );
};

export default Logout;
