import { t } from 'i18next';
import React from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { EmptyIllustration } from '@/js/components/404';
import { LoginButton } from '@/js/components/user/login';
import Logout from '@/js/components/user/logout';
import { selectUserState } from '@/js/store/user/selectors';
import routes from '@/js/utils/routes';

const AuthError = () => {
  const user = useSelector(selectUserState);

  return (
    <DocumentTitle title={`${t('Authentication Error')} | ${t('Metecho')}`}>
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
