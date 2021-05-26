import Alert from '@salesforce/design-system-react/components/alert';
import AlertContainer from '@salesforce/design-system-react/components/alert/container';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';

import TourDropdown from '~js/components/tour/dropdown';
import { selectSocketState } from '~js/store/socket/selectors';
import { selectUserState } from '~js/store/user/selectors';

const reloadPage = () => {
  window.location.reload();
};

const OfflineAlert = () => {
  const socket = useSelector(selectSocketState);

  return socket ? null : (
    <Alert
      labels={{
        heading: i18n.t(
          'You are in offline mode. We are trying to reconnect, but you may need to',
        ),
        headingLink: i18n.t('reload the page.'),
      }}
      onClickHeadingLink={reloadPage}
      variant="offline"
    />
  );
};

const TourAlert = () => {
  const user = useSelector(selectUserState);
  const tourIsOn = user?.self_guided_tour_enabled;
  const [showTour, setShowTour] = useState(true);

  const hideAlert = useCallback(() => {
    setShowTour(false);
  }, []);

  // When tour is turned on, show alert
  useEffect(() => {
    if (tourIsOn) {
      setShowTour(true);
    }
  }, [tourIsOn]);

  return window.GLOBALS.ENABLE_WALKTHROUGHS && tourIsOn && showTour ? (
    <Alert
      labels={{
        heading: (
          <Trans i18nKey="selfGuidedTourAlert">
            You are in self-guided tour mode. Click help{' '}
            <TourDropdown className="slds-text-color_default" /> to turn if off.
          </Trans>
        ),
      }}
      icon={<Icon category="utility" name="info" className="popover-button" />}
      className="tour-alert"
      dismissible
      onRequestClose={hideAlert}
    />
  ) : null;
};

const Alerts = () => (
  <AlertContainer className="slds-is-relative">
    <OfflineAlert />
    <TourAlert />
  </AlertContainer>
);

export default Alerts;
