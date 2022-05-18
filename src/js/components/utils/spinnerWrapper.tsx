import Spinner from '@salesforce/design-system-react/components/spinner';
import classNames from 'classnames';
import React from 'react';

const SpinnerWrapper = ({
  size,
  variant,
  className,
}: {
  size?: 'small' | 'xx-small' | 'x-small' | 'medium' | 'large';
  variant?: 'base' | 'brand' | 'inverse';
  className?: string;
}) => (
  <Spinner
    containerClassName={classNames('spinner-container', className)}
    size={size}
    variant={variant}
  />
);

export default SpinnerWrapper;
