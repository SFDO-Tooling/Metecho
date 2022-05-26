import Button from '@salesforce/design-system-react/components/button';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { LabelWithSpinner } from '@/js/components/utils';

interface Props {
  isRefreshing: boolean;
  doRefresh: () => void;
}

const RefreshCollaboratorsButton = ({ isRefreshing, doRefresh }: Props) => {
  const { t } = useTranslation();

  return isRefreshing ? (
    <Button
      label={<LabelWithSpinner label={t('Syncing GitHub Collaborators…')} />}
      variant="outline-brand"
      disabled
    />
  ) : (
    <Button
      label={t('Re-Sync GitHub Collaborators')}
      variant="outline-brand"
      iconCategory="utility"
      iconName="refresh"
      iconPosition="left"
      onClick={doRefresh}
    />
  );
};

export default RefreshCollaboratorsButton;
