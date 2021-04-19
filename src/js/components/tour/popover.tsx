import Button from '@salesforce/design-system-react/components/button';
import Popover from '@salesforce/design-system-react/components/popover';
import i18n from 'i18next';
import React from 'react';
import { useSelector } from 'react-redux';

import { selectUserState } from '~js/store/user/selectors';

const TourPopover = ({
  align,
  heading,
  body,
}: {
  align: string;
  heading: string;
  body: string;
}) => {
  const user = useSelector(selectUserState);

  return window.GLOBALS.ENABLE_WALKTHROUGHS &&
    user?.self_guided_tour_enabled ? (
    <Popover
      align={align}
      heading={heading}
      body={<p>{body}</p>}
      variant="walkthrough"
    >
      <Button
        variant="icon"
        assistiveText={{ icon: i18n.t('Learn More') }}
        iconCategory="utility"
        iconName="info_alt"
        style={{ color: '#DC72D1' }}
      />
    </Popover>
  ) : null;
};

export default TourPopover;
