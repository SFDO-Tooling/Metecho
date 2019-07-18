import Avatar from '@salesforce/design-system-react/components/avatar';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import React, { ComponentType } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import Errors from '@/components/apiErrors';
import OfflineAlert from '@/components/offlineAlert';
import Logout from '@/components/user/logout';
import { AppState } from '@/store';
import { removeError, RemoveErrorAction } from '@/store/errors/actions';
import { ErrorType } from '@/store/errors/reducer';
import { selectErrors } from '@/store/errors/selectors';
import { Socket } from '@/store/socket/reducer';
import { selectSocketState } from '@/store/socket/selectors';
import { logout } from '@/store/user/actions';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import routes from '@/utils/routes';

interface Props {
  user: User | null;
  socket: Socket;
  errors: ErrorType[];
  doLogout(): Promise<any>;
  doRemoveError(id: string): RemoveErrorAction;
}

interface ControlProps {
  user: User | null;
  doLogout(): Promise<any>;
}

const Controls = ({ user, doLogout }: ControlProps) => (
  <>
    <Avatar />
    <span className="slds-p-left_small">
        {user && user.username}
    </span>
    <Logout doLogout={doLogout} />
  </>
);

const Header = ({ user, socket, errors, doLogout, doRemoveError }: Props) => {
  const controls = () => (
    <PageHeaderControl
      className="slds-grid
        slds-grid_vertical-align-center"
      >
      <Controls user={user} doLogout={doLogout} />
    </PageHeaderControl>
  );

  return user ? (
    <>
      {socket ? null : <OfflineAlert />}
      <Errors errors={errors} doRemoveError={doRemoveError} />
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
      />
    </>
  ) : null;
};

const select = (appState: AppState) => ({
  user: selectUserState(appState),
  socket: selectSocketState(appState),
  errors: selectErrors(appState),
});

const actions = {
  doLogout: logout,
  doRemoveError: removeError,
};

const WrappedHeader: ComponentType = connect(
  select,
  actions,
)(Header);

export default WrappedHeader;
