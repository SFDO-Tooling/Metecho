import React from 'react';

export const Illustration = ({ svg }: { svg: string }) => (
  <div
    className="slds-illustration slds-illustration_small"
    dangerouslySetInnerHTML={{ __html: svg }}
  />
);

export default Illustration;
