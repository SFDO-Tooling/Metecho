import { EmptyIllustration } from '_js/components/404';
import { LoginButton } from '_js/components/user/login';
import Logout from '_js/components/user/logout';
import { selectUserState } from '_js/store/user/selectors';
import routes from '_js/utils/routes';
import i18n from 'i18next';
import React from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const AuthError = () => {
  const user = useSelector(selectUserState);

  return (
    <DocumentTitle
      title={`${i18n.t('Authentication Error')} | ${i18n.t('Metecho')}`}
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
            <Logout />
          ) : (
            <LoginButton id="auth-error-login" from={{ pathname: '/' }} />
          )}
        </div>
      </>
    </DocumentTitle>
  );
};

export default AuthError;
