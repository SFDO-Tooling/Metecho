import PageHeader from '@salesforce/design-system-react/components/page-header';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import Alerts from '~js/components/alerts';
import Errors from '~js/components/apiErrors';
import Toasts from '~js/components/toasts';
import TourDropdown from '~js/components/tour/dropdown';
import TourPopover from '~js/components/tour/popover';
import UserInfo from '~js/components/user/info';
import { selectUserState } from '~js/store/user/selectors';
import routes from '~js/utils/routes';

const Header = () => {
  const user = useSelector(selectUserState);

  const controls = () => (
    <PageHeaderControl className="slds-grid slds-grid_vertical-align-center">
      {window.GLOBALS.ENABLE_WALKTHROUGHS ? <TourDropdown /> : null}
      <div className="popover-reference">
        <UserInfo />
        <TourPopover
          align="bottom right"
          heading={i18n.t('Login & connection info')}
          body={i18n.t(
            'Here you can check which GitHub account is logged in, and log out as needed. Connect and disconnect from Salesforce. Enable a Dev Hub on your Salesforce account to contribute to Projects in Metecho.',
          )}
        />
      </div>
    </PageHeaderControl>
  );

  return user ? (
    <>
      <Alerts />
      <Errors />
      <Toasts />
      <PageHeader
        className="global-header
          slds-p-horizontal_x-large
          slds-p-vertical_medium"
        title={
          <>
            <Link
              to={routes.home()}
              className="slds-text-heading_large slds-text-link_reset"
            >
              <span data-logo-bit="start">met</span>
              <span data-logo-bit="end">échō </span>
            </Link>
            <TourPopover
              align="bottom"
              heading={i18n.t('What’s in a name?')}
              body={
                <Trans i18nKey="metechoname">
                  Metecho makes it easier for you to view, test, and contribute
                  to Salesforce Projects without learning GitHub.{' '}
                  <b>Pronunciation</b>: “Met” rhymes with “Bet.” “Echo” as in
                  the reflection of sound waves. <b>Definition</b>: Share or
                  participate in
                </Trans>
              }
            />
          </>
        }
        onRenderControls={controls}
      />
    </>
  ) : null;
};

export default Header;
