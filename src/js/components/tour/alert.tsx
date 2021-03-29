import Alert from '@salesforce/design-system-react/components/alert';
import AlertContainer from '@salesforce/design-system-react/components/alert/container';
import i18n from 'i18next';
import React from 'react';

const reloadPage = () => {
  window.location.reload();
};

const TourAlert = () => (
  <div
    className="slds-notify slds-notify_alert slds-alert_offline"
    role="alert"
  >
    <span className="slds-assistive-text">offline</span>
    <h2>
      You are in self-guided tour mode. Click help to turn it off.
      <a href="#">More Information</a>
    </h2>
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
