import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import { Location } from 'history';
import cookies from 'js-cookie';
import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { StaticContext } from 'react-router';
import { Redirect, RouteComponentProps, withRouter } from 'react-router-dom';

import welcomeMatBG from '@/img/welcome-mat-bg.png';
import welcomeMatFG from '@/img/welcome-mat-fg.png';
import { selectUserState } from '@/js/store/user/selectors';
import routes from '@/js/utils/routes';

interface Props
  extends RouteComponentProps<
    { [key: string]: any },
    StaticContext,
    { from?: Location }
  > {
  id?: string;
  label?: string | ReactElement;
  from?: { pathname?: string };
}

export const LoginButton = withRouter(
  ({ id = 'login', label, from = {}, location }: Props) => {
    const { t } = useTranslation();

    const action = window.api_urls.github_login?.();
    let { pathname } = location.state?.from || from;
    pathname = pathname || window.location.pathname;

    return (
      /* POSTing instead of redirecting to the login endpoint is more secure */
      <form action={action} method="POST">
        <input
          type="hidden"
          name="csrfmiddlewaretoken"
          value={cookies.get('csrftoken')}
        />
        <input
          type="hidden"
          name="next"
          value={pathname}
          data-testid="gh-login-next"
        />
        <Button
          id={id}
          type="submit"
          label={label === undefined ? t('Log In With GitHub') : label}
          variant="brand"
          disabled={!action}
        />
      </form>
    );
  },
);

const Login = () => {
  const { t } = useTranslation();
  const user = useSelector(selectUserState);

  return user ? (
    <Redirect to={routes.home()} />
  ) : (
    <div
      className="slds-welcome-mat
        slds-welcome-mat_info-only
        welcome-container"
    >
      <div className="slds-welcome-mat__content slds-grid welcome-inner">
        <div
          className="slds-welcome-mat__info
            slds-size_1-of-1
            slds-medium-size_1-of-2"
          style={{ backgroundImage: `url(${welcomeMatBG})` }}
        >
          <div className="slds-welcome-mat__info-content">
            <h1 className="slds-welcome-mat__info-title">
              {t('Welcome to Metecho!')}
            </h1>
            <div
              className="slds-welcome-mat__info-description
                slds-text-longform"
            >
              <p>
                <Trans i18nKey="welcomeMessage">
                  <strong>To get started</strong> log in with your GitHub
                  account.
                </Trans>
              </p>
            </div>
            <div className="slds-welcome-mat__info-actions">
              <LoginButton />
            </div>
          </div>
        </div>
        <div
          className="slds-welcome-mat__tiles
            slds-size_1-of-1
            slds-medium-size_1-of-2
            slds-welcome-mat__tiles_info-only
            slds-grid
            slds-grid_vertical
            slds-p-left_xx-large
            slds-p-right_xx-large
            slds-grid_align-center"
        >
          <h2 className="slds-text-heading_large slds-p-bottom_medium">
            {t('What is Metecho?')}
          </h2>
          <p className="slds-p-bottom_xx-large">
            {t(
              'Metecho is a tool to help collaborate on sharable Salesforce Projects.',
            )}
          </p>
          <h3 className="slds-text-heading_small slds-p-bottom_small">
            {t('What can I do with Metecho?')}
          </h3>
          <ul className="slds-m-bottom_x-large">
            <li className="slds-p-bottom_small slds-grid">
              <Icon
                category="utility"
                name="adduser"
                size="x-small"
                className="slds-m-right_x-small"
              />
              {t('Assign Epics and Tasks to members of your team.')}
            </li>
            <li className="slds-p-bottom_small slds-grid">
              <Icon
                category="utility"
                name="magicwand"
                size="x-small"
                className="slds-m-right_x-small"
              />
              {t('Easily create a Dev Org for an existing Epic.')}
            </li>
            <li className="slds-p-bottom_small slds-grid">
              <Icon
                category="utility"
                name="upload"
                size="x-small"
                className="slds-m-right_x-small"
              />
              {t('Make changes and retrieve them into a repository on GitHub.')}
            </li>
          </ul>
          <img
            src={welcomeMatFG}
            alt={t('screenshots of Metecho app interface')}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
