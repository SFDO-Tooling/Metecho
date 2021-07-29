import Button from '@salesforce/design-system-react/components/button';
import Popover from '@salesforce/design-system-react/components/popover';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from 'src/js/store';

import { updateTour } from '@/js/store/user/actions';
import { selectUserState } from '@/js/store/user/selectors';

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

  const isViewed = user?.self_guided_tour_state?.includes(id);

  const handleOpen = useCallback(() => {
    /* istanbul ignore else */
    if (user && !isViewed) {
      const state = user.self_guided_tour_state
        ? [...user.self_guided_tour_state]
        : [];
      state.push(id);
      dispatch(updateTour({ state }));
    }
  }, [dispatch, id, isViewed, user]);

  return window.GLOBALS.ENABLE_WALKTHROUGHS &&
    user?.self_guided_tour_enabled ? (
    <Popover
      id={id}
      align={align}
      heading={heading}
      body={<p>{body}</p>}
      variant="walkthrough"
      triggerClassName="popover-wrapper"
      onOpen={handleOpen}
    >
      <Button
        variant="icon"
        assistiveText={{ icon: i18n.t('Learn More') }}
        iconCategory="utility"
        iconName={isViewed ? 'success' : 'info'}
        className={classNames('popover-button', {
          'is-viewed': isViewed,
        })}
      />
    </Popover>
  ) : null;
};

export default TourPopover;
