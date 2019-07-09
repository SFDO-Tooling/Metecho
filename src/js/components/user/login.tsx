import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React, { ComponentType, ReactElement } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import { AppState } from '@/store';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { addUrlParams } from '@/utils/api';
import routes from '@/utils/routes';

interface Props extends RouteComponentProps {
  id?: string;
  label?: string | ReactElement;
  from?: { pathname?: string };
}

export const LoginButton = withRouter(
  ({ id = 'login', label, from = {}, location }: Props) => {
    const handleClick = () => {
      /* istanbul ignore else */
      if (window.api_urls.github_login) {
        let { pathname } = (location.state && location.state.from) || from;
        if (!pathname) {
          pathname = window.location.pathname;
        }
        window.location.assign(
          addUrlParams(window.api_urls.github_login(), {
            next: pathname,
          }),
        );
      }
    };

    return (
      <Button
        id={id}
        label={label === undefined ? i18n.t('Log In With GitHub') : label}
        variant="brand"
        disabled={!window.api_urls.github_login}
        onClick={handleClick}
      />
    );
  },
);

const Login = ({ user }: { user: User | null }) =>
  user ? (
    <Redirect to={routes.home()} />
  ) : (
    <div className="slds-align_absolute-center">
      <div className="slds-text-longform slds-p-around_x-large">
        <h1 className="slds-text-heading_large">
          {i18n.t('Welcome to MetaShare!')}
        </h1>
        <p>
          This is a stub. It will eventually be replaced with an{' '}
          <a href="https://www.lightningdesignsystem.com/components/welcome-mat/">
            SLDS Welcome Mat Component
          </a>{' '}
          once the{' '}
          <a href="https://github.com/salesforce/design-system-react/issues/1876">
            React implementation
          </a>{' '}
          is complete.
        </p>
        <LoginButton />
      </div>
    </div>
  );

const select = (appState: AppState) => ({
  user: selectUserState(appState),
});

const WrappedLogin: ComponentType = connect(select)(Login);

export default WrappedLogin;
