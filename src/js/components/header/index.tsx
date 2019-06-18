import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import Login from 'components/header/login';
import Logout from 'components/header/logout';
import OfflineAlert from 'components/offlineAlert';
import routes from 'utils/routes';
import { AppState } from 'store';
import { Socket } from 'store/socket/reducer';
import { User } from 'store/user/reducer';
import { logout } from 'store/user/actions';
import { selectSocketState } from 'store/socket/selectors';
import { selectUserState } from 'store/user/selectors';

interface Props {
  user: User | null;
  socket: Socket;
  doLogout: () => Promise<any>;
}

class Header extends React.Component<Props> {
  private controls = () => {
    const { user, doLogout } = this.props;
    return user ? <Logout user={user} doLogout={doLogout} /> : <Login />;
  };

  public render() {
    const { socket } = this.props;
    return (
      <>
        {socket ? null : <OfflineAlert />}
        <PageHeader
          className="global-header
            slds-p-horizontal_x-large
            slds-p-vertical_medium"
          title={
            <Link
              to={routes.home()}
              className="slds-text-heading_large
                slds-text-link_reset"
            >
              <span data-logo-bit="start">meta</span>
              <span data-logo-bit="end">share</span>
            </Link>
          }
          onRenderControls={this.controls}
          variant="object-home"
        />
      </>
    );
  }
}

const select = (appState: AppState) => ({
  user: selectUserState(appState),
  socket: selectSocketState(appState),
});

const actions = {
  doLogout: logout,
};

const WrappedHeader: React.ComponentType = connect(
  select,
  actions,
)(Header);

export default WrappedHeader;
