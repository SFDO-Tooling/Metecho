import Button from '@salesforce/design-system-react/components/button';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { LabelWithSpinner } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { refreshOrgs } from '@/js/store/user/actions';

interface Props {
  isRefreshing: boolean;
}

const RefreshGitHubOrgsButton = ({ isRefreshing }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch>();
  const doRefreshOrgs = useCallback(() => {
    dispatch(refreshOrgs());
  }, [dispatch]);

  return isRefreshing ? (
    <Button
      label={<LabelWithSpinner label={t('Syncing GitHub Organizations…')} />}
      variant="outline-brand"
      disabled
    />
  ) : (
    <Button
      label={t('Re-Sync GitHub Organizations')}
      variant="outline-brand"
      iconCategory="utility"
      iconName="refresh"
      iconPosition="left"
      onClick={doRefreshOrgs}
    />
  );
};

export default RefreshGitHubOrgsButton;
