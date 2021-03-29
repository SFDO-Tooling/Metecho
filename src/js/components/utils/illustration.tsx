import classNames from 'classnames';
import React from 'react';

export const Illustration = ({
  svg,
  className,
}: {
  svg: string;
  className?: string;
}) => (
  <div
    className={classNames(
      className,
      'slds-illustration',
      'slds-illustration_small',
    )}
    dangerouslySetInnerHTML={{ __html: svg }}
  />
);

export default Illustration;
