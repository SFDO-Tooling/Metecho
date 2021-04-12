import React from 'react';

import { TourDropdown } from '~js/components/header';

const TourAlert = ({
  handleTourStatus,
}: {
  handleTourStatus: (status: 'on' | 'off') => void;
}) => (
  <div
    className="slds-notify slds-notify_alert slds-alert_offline"
    role="alert"
  >
    <span className="slds-assistive-text">self-guided tour</span>
    <div style={{ display: 'flex' }}>
      You are in self-guided tour mode. Click help{' '}
      <TourDropdown show handleTourStatus={handleTourStatus} /> to turn it off.
    </div>

    <div className="slds-notify__close">
      <button
        className="slds-button slds-button_icon slds-button_icon-small slds-button_icon-inverse"
        title="Close"
      >
        <svg className="slds-button__icon" aria-hidden="true">
          <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
        </svg>
        <span className="slds-assistive-text">Close</span>
      </button>
    </div>
  </div>
);

export default TourAlert;
