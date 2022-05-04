import React from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerWrapper } from '@/js/components/utils';

// For use as a "loading" button label
const LabelWithSpinner = ({
  label,
  variant = 'base',
  size = 'x-small',
}: {
  label?: string;
  variant?: 'base' | 'brand' | 'inverse';
  size?: 'small' | 'xx-small' | 'x-small' | 'medium' | 'large';
}) => {
  const { t } = useTranslation();

  return (
    <>
      <span className="slds-is-relative slds-m-right_large">
        <SpinnerWrapper variant={variant} size={size} />
      </span>
      {label || t('Loading…')}
    </>
  );
};

export default LabelWithSpinner;
