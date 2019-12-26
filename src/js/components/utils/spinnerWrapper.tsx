import Spinner from '@salesforce/design-system-react/components/spinner';
import React from 'react';

const SpinnerWrapper = ({
  size,
  variant,
}: {
  size?: string;
  variant?: string;
}) => (
  <Spinner
    containerClassName="spinner-container"
    size={size}
    variant={variant}
  />
);

export default SpinnerWrapper;
