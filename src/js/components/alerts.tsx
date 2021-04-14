import Alert from '@salesforce/design-system-react/components/alert';
import AlertContainer from '@salesforce/design-system-react/components/alert/container';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';

import TourDropdown from '~js/components/tour/dropdown';
import { selectSocketState } from '~js/store/socket/selectors';

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
  // @@@ This should pull from Redux state: `user.self_guided_tour_enabled`
  const tourIsOn = true;
  const [showTour, setShowTour] = useState(true);

  const hideAlert = useCallback(() => {
    setShowTour(false);
  }, []);

  return window.GLOBALS.ENABLE_WALKTHROUGHS && tourIsOn && showTour ? (
    <Alert
      labels={{
        heading: (
          <Trans i18nKey="selfGuidedTourAlert">
            You are in self-guided tour mode. Click help{' '}
            {/*   <TourDropdown isAlert /> */} to turn if off.
          </Trans>
        ),
      }}
      icon={<Icon category="utility" name="info_alt" />}
      dismissible
      onRequestClose={hideAlert}
    />
  ) : null;
};

const Alerts = () => (
  <AlertContainer className="alerts">
    <OfflineAlert />
    <TourAlert />
  </AlertContainer>
);

export default Alerts;
