import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import WelcomeMatTile from '@salesforce/design-system-react/components/welcome-mat/tile';
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
import welcomeMatBG from '#/welcome-mat-bg.png';

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
    <div className="slds-welcome-mat slds-welcome-mat_info-only welcome-container">
      <div className="slds-welcome-mat__content slds-grid welcome-inner">
        <div
          className="slds-welcome-mat__info slds-size_1-of-1
          slds-medium-size_1-of-2"
          style={{ backgroundImage: `url(${welcomeMatBG})` }}
        >
          <div className="slds-welcome-mat__info-content">
            <h2 className="slds-welcome-mat__info-title">
              {i18n.t('Welcome to MetaShare!')}
            </h2>
            <div
              className="slds-welcome-mat__info-description
                slds-text-longform"
            >
              <p>
                {i18n.t(
                  'Welcome to MetaShare, the web-based tool for collaborating on Salesforce projects.',
                )}
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
            slds-grid_align-center
            slds-grid_vertical-align-center"
        >
          <WelcomeMatTile
            title={i18n.t('Welcome to MetaShare!')}
            description="Lorem ipsum dolor sit amet, lorem ipsum dolor sit amet."
            icon={<Icon category="utility" name="animal_and_nature" />}
            variant="info-only"
          />
          <WelcomeMatTile
            title="Something about MetaShare"
            description="Lorem ipsum dolor sit amet, lorem ipsum dolor sit amet."
            icon={<Icon category="utility" name="call" />}
            variant="info-only"
          />
          <WelcomeMatTile
            title="Something about MetaShare"
            description="Lorem ipsum dolor sit amet, lorem ipsum dolor sit amet."
            icon={<Icon category="utility" name="upload" />}
            variant="info-only"
          />
          <WelcomeMatTile
            title="Something about MetaShare"
            description="Lorem ipsum dolor sit amet, lorem ipsum dolor sit amet."
            icon={<Icon category="utility" name="magicwand" />}
            variant="info-only"
          />
          <WelcomeMatTile
            title="Something about MetaShare"
            description="Lorem ipsum dolor sit amet, lorem ipsum dolor sit amet."
            icon={<Icon category="utility" name="knowledge_base" />}
            variant="info-only"
          />
        </div>
      </div>
    </div>
  );

const select = (appState: AppState) => ({
  user: selectUserState(appState),
});

const WrappedLogin: ComponentType = connect(select)(Login);

export default WrappedLogin;
