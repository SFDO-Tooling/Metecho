import PageHeader from '@salesforce/design-system-react/components/page-header';
import React, { ComponentType } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import Logout from '@/components/header/logout';
import OfflineAlert from '@/components/offlineAlert';
import { AppState } from '@/store';
import { Socket } from '@/store/socket/reducer';
import { selectSocketState } from '@/store/socket/selectors';
import { logout } from '@/store/user/actions';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import routes from '@/utils/routes';

interface Props {
  user: User | null;
  socket: Socket;
  doLogout: () => Promise<any>;
}

const Header = ({ user, socket, doLogout }: Props) => {
  const controls = () => <Logout user={user} doLogout={doLogout} />;

  return user ? (
    <>
      {socket ? null : <OfflineAlert />}
      <PageHeader
        className="global-header
          slds-p-horizontal_x-large
          slds-p-vertical_medium"
        title={
          <Link
            to={routes.home()}
            className="slds-text-heading_large slds-text-link_reset"
          >
            <span data-logo-bit="start">meta</span>
            <span data-logo-bit="end">share</span>
          </Link>
        }
        onRenderControls={controls}
        variant="object-home"
      />
    </>
  ) : null;
};

const select = (appState: AppState) => ({
  user: selectUserState(appState),
  socket: selectSocketState(appState),
});

const actions = {
  doLogout: logout,
};

const WrappedHeader: ComponentType = connect(
  select,
  actions,
)(Header);

export default WrappedHeader;
