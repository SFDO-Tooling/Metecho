import * as React from 'react';
import * as ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import i18n from 'i18next';
import logger from 'redux-logger';
import settings from '@salesforce/design-system-react/components/settings';
import thunk from 'redux-thunk';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore, Action } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import actionSprite from '@salesforce-ux/design-system/assets/icons/action-sprite/svg/symbols.svg';
import customSprite from '@salesforce-ux/design-system/assets/icons/custom-sprite/svg/symbols.svg';
import doctypeSprite from '@salesforce-ux/design-system/assets/icons/doctype-sprite/svg/symbols.svg';
import standardSprite from '@salesforce-ux/design-system/assets/icons/standard-sprite/svg/symbols.svg';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';

import AuthError from 'components/authError';
import ErrorBoundary from 'components/error';
import Footer from 'components/footer';
import FourOhFour from 'components/404';
import Header from 'components/header';
import Login from 'components/login';
import SFLogo from 'images/salesforce-logo.png';
import initializeI18n from 'i18n';
import reducer from 'store';
import { createSocket } from 'utils/websockets';
import { log, logError } from 'utils/logging';
import { login, refetchAllData } from 'store/user/actions';
import { routePatterns } from 'utils/routes';
import { PrivateRoute } from 'components/utils';

const Home = () => (
  <div
    className="slds-text-longform
      slds-p-around_x-large"
  >
    <h1 className="slds-text-heading_large">
      {i18n.t('Welcome to MetaShare!')}
    </h1>
    <p>{i18n.t('This is sample intro text, where your content might live.')}</p>
  </div>
);

const App = () => (
  <DocumentTitle title={i18n.t('MetaShare')}>
    <div
      className="slds-grid
        slds-grid_frame
        slds-grid_vertical"
    >
      <ErrorBoundary>
        <Header />
        <div
          className="slds-grow
            slds-shrink-none"
        >
          <ErrorBoundary>
            <Switch>
              <Route exact path={routePatterns.login()} component={Login} />
              <PrivateRoute
                exact
                path={routePatterns.home()}
                component={Home}
              />
              <Route path={routePatterns.auth_error()} component={AuthError} />
              <Route component={FourOhFour} />
            </Switch>
          </ErrorBoundary>
        </div>
        <Footer logoSrc={SFLogo} />
      </ErrorBoundary>
    </div>
  </DocumentTitle>
);

initializeI18n((i18nError?: string) => {
  if (i18nError) {
    log(i18nError);
  }
  const el = document.getElementById('app');
  if (el) {
    // Create store
    const appStore = createStore(
      reducer,
      {},
      composeWithDevTools(applyMiddleware(thunk, logger)),
    );

    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    window.socket = createSocket({
      url: `${protocol}//${host}${window.api_urls.ws_notifications()}`,
      dispatch: appStore.dispatch,
      options: {
        onreconnect: () => {
          appStore.dispatch((refetchAllData() as any) as Action);
        },
      },
    });

    // Get JS globals
    let GLOBALS = {};
    try {
      const globalsEl = document.getElementById('js-globals');
      if (globalsEl && globalsEl.textContent) {
        GLOBALS = JSON.parse(globalsEl.textContent);
      }
    } catch (err) {
      logError(err);
    }
    window.GLOBALS = GLOBALS;

    // Get logged-in/out status
    const userString = el.getAttribute('data-user');
    if (userString) {
      let user;
      try {
        user = JSON.parse(userString);
      } catch (err) {
        // swallow error
      }
      if (user) {
        // Login
        appStore.dispatch(login(user));
      }
    }
    el.removeAttribute('data-user');

    // Set App element (used for react-SLDS modals)
    settings.setAppElement(el);

    ReactDOM.render(
      <Provider store={appStore}>
        <BrowserRouter>
          <IconSettings
            actionSprite={actionSprite}
            customSprite={customSprite}
            doctypeSprite={doctypeSprite}
            standardSprite={standardSprite}
            utilitySprite={utilitySprite}
          >
            <App />
          </IconSettings>
        </BrowserRouter>
      </Provider>,
      el,
    );
  }
});
