import Button from '@salesforce/design-system-react/components/button';
import Popover from '@salesforce/design-system-react/components/popover';
import i18n from 'i18next';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from 'src/js/store';
import { updateTour } from 'src/js/store/user/actions';

import { selectUserState } from '~js/store/user/selectors';

const TourPopover = ({
  align,
  heading,
  body,
  id,
}: {
  align: string;
  heading: string;
  body: string | JSX.Element;
  id: string;
}) => {
  const user = useSelector(selectUserState);

  const dispatch = useDispatch<ThunkDispatch>();

  const handleClick = useCallback(() => {
    if (user?.self_guided_tour_state?.includes(id)) {
      return id;
    } else {
  dispatch(/* updateTour({ tour_state: tour_state.push(id) }) user?.self_guided_tour_state?.push(id);
    }

  }
}, [dispatch], */ )

  return window.GLOBALS.ENABLE_WALKTHROUGHS &&
    user?.self_guided_tour_enabled ? (
    <Popover
      id={id}
      align={align}
      heading={heading}
      body={<p>{body}</p>}
      variant="walkthrough"
      triggerClassName="popover-wrapper"
      /*   isOpen={isOpen} */
    >
      <Button
        variant="icon"
        assistiveText={{ icon: i18n.t('Learn More') }}
        iconCategory="utility"
        iconName="info"
        className="popover-button"
        onClick={handleClick}
      />
    </Popover>
  ) : null;
};

export default TourPopover;
