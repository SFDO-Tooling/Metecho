import i18n from 'i18next';
import React, { ComponentType } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { EmptyIllustration } from '@/components/404';
import { LoginButton } from '@/components/user/login';
import Logout from '@/components/user/logout';
import { AppState } from '@/store';
import { logout } from '@/store/user/actions';
import { User as UserType } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import routes from '@/utils/routes';

interface Props {
  user: UserType | null;
  doLogout(): Promise<any>;
}

const AuthError = ({ user, doLogout }: Props) => (
  <DocumentTitle
    title={`${i18n.t('Authentication Error')} | ${i18n.t('MetaShare')}`}
  >
    <>
      <EmptyIllustration
        message={
          <Trans i18nKey="errorWithAccount">
            An error occurred with your account. Try the{' '}
            <Link to={routes.home()}>home page</Link>?
          </Trans>
        }
      />
      <div className="slds-align_absolute-center">
        {user ? (
          <Logout doLogout={doLogout} />
        ) : (
          <LoginButton id="auth-error-login" from={{ pathname: '/' }} />
        )}
      </div>
    </>
  </DocumentTitle>
);

const select = (appState: AppState) => ({
  user: selectUserState(appState),
});

const actions = {
  doLogout: logout,
};

const WrappedAuthError: ComponentType = connect(
  select,
  actions,
)(AuthError);

export default WrappedAuthError;
