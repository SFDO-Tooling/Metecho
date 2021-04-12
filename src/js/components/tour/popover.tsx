import Button from '@salesforce/design-system-react/components/button';
import Popover from '@salesforce/design-system-react/components/popover';
import i18n from 'i18next';
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
  <Popover
    align={align}
    heading={heading}
    body={<p>{body}</p>}
    // @@@ This should pull from Redux state: `user.self_guided_tour_enabled`
    // isEnabled={user.self_guided_tour_enabled}
    variant="walkthrough"
  >
    <Button
      variant="icon"
      assistiveText={{ icon: i18n.t('Learn More') }}
      iconCategory="utility"
      iconName="info_alt"
    />
  </Popover>
);

export default TourPopover;
