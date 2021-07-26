import i18n from 'i18next';
import React from 'react';

import { SpinnerWrapper } from '#js/components/utils';

// For use as a "loading" button label
const LabelWithSpinner = ({
  label,
  variant = 'base',
  size = 'x-small',
}: {
  label?: string;
  variant?: string;
  size?: string;
}) => (
  <>
    <span className="slds-is-relative slds-m-right_large">
      <SpinnerWrapper variant={variant} size={size} />
    </span>
    {label || i18n.t('Loading…')}
  </>
);

export default LabelWithSpinner;
