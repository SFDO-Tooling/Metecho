import Spinner from '@salesforce/design-system-react/components/spinner';
import React from 'react';

const SpinnerWrapper = ({
  size,
  variant,
}: {
  size?: 'small' | 'xx-small' | 'x-small' | 'medium' | 'large';
  variant?: 'base' | 'brand' | 'inverse';
}) => (
  <Spinner
    containerClassName="spinner-container"
    size={size}
    variant={variant}
  />
);

export default SpinnerWrapper;
