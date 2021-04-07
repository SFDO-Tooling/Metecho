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
  <IconSettings iconPath="/assets/icons">
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
      <Button label="Trigger Popover" />
    </Popover>
  </IconSettings>
);

export default TourPopover;
