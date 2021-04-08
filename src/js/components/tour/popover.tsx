// import log from '@salesforce/design-system-react/utilities/log';
import Button from '@salesforce/design-system-react/components/button';
import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import Popover from '@salesforce/design-system-react/components/popover';
import React from 'react';

const TourPopover = ({
  align,
  heading,
  body,
}: {
  align: string;
  heading: string;
  body: string;
}) => (
  <IconSettings iconPath="static/images">
    <Popover
      align={align}
      body={<p>{body}</p>}
      footerWalkthroughActions={<Button variant="brand">Next</Button>}
      heading={heading}
      id="popover-walkthrough"
      stepText="Step 2 of 4"
      variant="walkthrough"
      /* {...this.props} */
    >
      <button className="slds-button slds-button_icon slds-button_icon-small ">
        <svg
          version="1.1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          width="52px"
          height="52px"
          viewBox="0 0 52 52"
          enableBackground="new 0 0 52 52"
          xmlSpace="preserve"
        >
          <path
            fill="#F7D6F4"
            d="M26,2C12.7,2,2,12.7,2,26s10.7,24,24,24s24-10.7,24-24S39.3,2,26,2z M26,44C16,44,8,36,8,26S16,8,26,8s18,8,18,18S36,44,26,44z"
          />
          <path
            fill="#F7D6F4"
            d="M26,14.1c1.7,0,3,1.3,3,3s-1.3,3-3,3s-3-1.3-3-3S24.3,14.1,26,14.1z"
          />
          <path
            fill="#F7D6F4"
            d="M31,35.1c0,0.5-0.4,0.9-1,0.9h-8c-0.5,0-1-0.3-1-0.9v-2c0-0.5,0.4-1.1,1-1.1c0.5,0,1-0.3,1-0.9v-4c0-0.5-0.4-1.1-1-1.1c-0.5,0-1-0.3-1-0.9v-2c0-0.5,0.4-1.1,1-1.1h6c0.5,0,1,0.5,1,1.1v8c0,0.5,0.4,0.9,1,0.9c0.5,0,1,0.5,1,1.1V35.1z"
          />
        </svg>
      </button>
    </Popover>
  </IconSettings>
);

export default TourPopover;
