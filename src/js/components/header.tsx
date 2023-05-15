import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import Alerts from '@/js/components/alerts';
import Errors from '@/js/components/apiErrors';
import Toasts from '@/js/components/toasts';
import TourDropdown from '@/js/components/tour/dropdown';
import TourPopover from '@/js/components/tour/popover';
import UserInfo from '@/js/components/user/info';
import { ExternalLink } from '@/js/components/utils';
import { selectUserState } from '@/js/store/user/selectors';
import routes from '@/js/utils/routes';

const Header = () => {
  const { t } = useTranslation();
  const user = useSelector(selectUserState);

  const controls = () => (
    <PageHeaderControl className="slds-grid slds-grid_vertical-align-center">
      {window.GLOBALS.ENABLE_WALKTHROUGHS ? (
        <TourDropdown triggerClassName="tour-walkthroughs slds-m-right_x-small" />
      ) : null}
      <div className="slds-is-relative">
        <UserInfo />
        <TourPopover
          id="tour-user"
          align="bottom right"
          heading={t('Account & connection info')}
          body={
            <Trans i18nKey="tourUser">
              Here you can check which GitHub account is logged in, connect and
              disconnect from Salesforce, or log out as needed.{' '}
              <ExternalLink
                url="https://help.salesforce.com/articleView?id=sfdx_setup_enable_devhub.htm&type=0"
                showButtonIcon
              >
                Enable Dev Hub
              </ExternalLink>{' '}
              on your Salesforce account to contribute to Projects in Metecho.
            </Trans>
          }
        />
      </div>
    </PageHeaderControl>
  );

  return user ? (
    <>
      <Alerts />
      <Errors />
      <Toasts />
      <div className="slds-is-relative logo-popover">
        <TourPopover
          id="tour-metecho-name"
          align="bottom left"
          heading={t('What’s in a name?')}
          body={
            <Trans i18nKey="tourMetechoName">
              Metecho makes it easier for you to view, test, and contribute to
              Salesforce Projects without learning GitHub.
              <br />
              <br />
              <b>Pronunciation</b>: “Met” rhymes with “bet.” “Echo” as in the
              reflection of sound waves.
              <br />
              <b>Definition</b>: To share or participate in.
            </Trans>
          }
        />

        <div className="slds-page-header global-header slds-p-horizontal_x-large slds-p-vertical_medium">
          <div className="slds-page-header__row">
            <div className="slds-page-header__col-title">
              <div className="slds-page-header__name">
                <div className="slds-page-header__name-title">
                  <span className="slds-page-header__title slds-truncate">
                    <Link
                      to={routes.home()}
                      className="slds-text-heading_large slds-text-link_reset walkthrough-metecho-name"
                    >
                      <span data-logo-bit="start">met</span>
                      <span data-logo-bit="end">échō</span>
                    </Link>
                  </span>
                </div>
              </div>
            </div>
            <div className="slds-page-header__col-controls slds-align-middle">
              <div className="slds-page-header__controls">{controls()}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null;
};

export default Header;
