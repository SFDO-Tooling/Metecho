import React from 'react';

import Login from './sfLogin';

export interface Props {}

const DevHubConnect: React.SFC<Props> = () => {
  return (
    <article className="slds-card">
      <div className="slds-card__body slds-card__body_inner">
        <span>To create a scratch org, connect to </span>
        <Login />
      </div>
    </article>
  );
};

export default DevHubConnect;
