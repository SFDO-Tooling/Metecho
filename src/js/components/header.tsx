import PageHeader from '@salesforce/design-system-react/components/page-header';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import Alerts from '~js/components/alerts';
import Errors from '~js/components/apiErrors';
import Toasts from '~js/components/toasts';
import TourDropdown from '~js/components/tour/dropdown';
import UserInfo from '~js/components/user/info';
import { selectUserState } from '~js/store/user/selectors';
import routes from '~js/utils/routes';

const Header = () => {
  const user = useSelector(selectUserState);

  const controls = () => (
    <PageHeaderControl className="slds-grid slds-grid_vertical-align-center">
      {/* {window.GLOBALS.ENABLE_WALKTHROUGHS ? <TourDropdown /> : null} */}
      <UserInfo />
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
          <Link
            to={routes.home()}
            className="slds-text-heading_large slds-text-link_reset"
          >
            <span data-logo-bit="start">met</span>
            <span data-logo-bit="end">échō</span>
          </Link>
        }
        onRenderControls={controls}
      />
    </>
  ) : null;
};

export default Header;
