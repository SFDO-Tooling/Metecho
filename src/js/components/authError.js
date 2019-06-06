// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import i18n from 'i18next';
import { Link } from 'react-router-dom';
import { Trans } from 'react-i18next';
import { connect } from 'react-redux';

import routes from 'utils/routes';
import { selectUserState } from 'store/user/selectors';
import Login from 'components/header/login';
import { EmptyIllustration } from 'components/404';
import type { AppState } from 'store';
import type { InitialProps } from 'components/utils';
import type { User as UserType } from 'store/user/reducer';

const AuthError = ({ user }: { user: UserType }) => (
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
        <Login
          id="auth-error-login"
          label={
            user ? i18n.t('Log In With a Different Org') : i18n.t('Log In')
          }
          buttonClassName="slds-p-horizontal_xxx-small"
          buttonVariant="base"
        />
      </div>
    </>
  </DocumentTitle>
);

const select = (appState: AppState) => ({
  user: selectUserState(appState),
});

const WrappedAuthError: React.ComponentType<InitialProps> = connect(select)(
  AuthError,
);

export default WrappedAuthError;
