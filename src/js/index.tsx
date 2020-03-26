import actionSprite from '@salesforce-ux/design-system/assets/icons/action-sprite/svg/symbols.svg';
import customSprite from '@salesforce-ux/design-system/assets/icons/custom-sprite/svg/symbols.svg';
import doctypeSprite from '@salesforce-ux/design-system/assets/icons/doctype-sprite/svg/symbols.svg';
import standardSprite from '@salesforce-ux/design-system/assets/icons/standard-sprite/svg/symbols.svg';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';
import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import settings from '@salesforce/design-system-react/components/settings';
import i18n from 'i18next';
import React, { useEffect } from 'react';
import DocumentTitle from 'react-document-title';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {
  BrowserRouter,
  Redirect,
  Route,
  RouteComponentProps,
  Switch,
  withRouter,
} from 'react-router-dom';
import { AnyAction, applyMiddleware, createStore, Dispatch } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import logger from 'redux-logger';
import thunk, { ThunkDispatch } from 'redux-thunk';

import FourOhFour from '@/components/404';
import ErrorBoundary from '@/components/error';
import Footer from '@/components/footer';
import Header from '@/components/header';
import ProjectDetail from '@/components/projects/detail';
import RepositoryDetail from '@/components/repositories/detail';
import RepositoryList from '@/components/repositories/list';
import TaskDetail from '@/components/tasks/detail';
import AuthError from '@/components/user/authError';
import Login from '@/components/user/login';
import { PrivateRoute } from '@/components/utils';
import initializeI18n from '@/i18n';
import reducer from '@/store';
import { fetchObjects } from '@/store/actions';
import { clearErrors } from '@/store/errors/actions';
import { reposRefreshing } from '@/store/repositories/actions';
import { selectRepositories } from '@/store/repositories/selectors';
import { clearToasts } from '@/store/toasts/actions';
import { login, refetchAllData } from '@/store/user/actions';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { OBJECT_TYPES } from '@/utils/constants';
import { log, logError } from '@/utils/logging';
import routes, { routePatterns } from '@/utils/routes';
import { createSocket } from '@/utils/websockets';
import SFLogo from '#/salesforce-logo.png';

const App = withRouter(
  ({
    dispatch,
    location: { pathname },
  }: { dispatch: Dispatch } & RouteComponentProps) => {
    useEffect(
      () => () => {
        dispatch(clearErrors());
        dispatch(clearToasts());
      },
      [dispatch, pathname],
    );

    return (
      <DocumentTitle title={i18n.t('Metecho')}>
        <div className="slds-grid slds-grid_frame slds-grid_vertical">
          <ErrorBoundary>
            <Header />
            <div className="slds-grow slds-shrink-none">
              <ErrorBoundary>
                <Switch>
                  <Route exact path={routePatterns.login()} component={Login} />
                  <Route
                    exact
                    path={routePatterns.home()}
                    render={() => <Redirect to={routes.repository_list()} />}
                  />
                  <PrivateRoute
                    exact
                    path={routePatterns.repository_list()}
                    component={RepositoryList}
                  />
                  <PrivateRoute
                    exact
                    path={routePatterns.repository_detail()}
                    component={RepositoryDetail}
                  />
                  <PrivateRoute
                    exact
                    path={routePatterns.project_detail()}
                    component={ProjectDetail}
                  />
                  <PrivateRoute
                    exact
                    path={routePatterns.task_detail()}
                    component={TaskDetail}
                  />
                  <Route
                    path={routePatterns.auth_error()}
                    component={AuthError}
                  />
                  <PrivateRoute component={FourOhFour} />
                </Switch>
              </ErrorBoundary>
            </div>
            <Footer logoSrc={SFLogo} />
          </ErrorBoundary>
        </div>
      </DocumentTitle>
    );
  },
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
      undefined,
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
          (appStore.dispatch as ThunkDispatch<any, void, AnyAction>)(
            refetchAllData(),
          );
        },
      },
    });

    // Get JS globals
    let GLOBALS = {};
    try {
      const globalsEl = document.getElementById('js-globals');
      if (globalsEl?.textContent) {
        GLOBALS = JSON.parse(globalsEl.textContent);
      }
    } catch (err) {
      logError(err);
    }
    window.GLOBALS = GLOBALS;

    // Get logged-in/out status
    let userData;
    const userString = el.getAttribute('data-user');
    if (userString) {
      try {
        userData = JSON.parse(userString) as User;
      } catch (err) {
        // swallow error
      }
      if (userData) {
        // Login
        appStore.dispatch(login(userData));
      }
    }
    el.removeAttribute('data-user');

    // Set App element (used for react-SLDS modals)
    settings.setAppElement(el);

    const renderApp = () => {
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
              <App dispatch={appStore.dispatch} />
            </IconSettings>
          </BrowserRouter>
        </Provider>,
        el,
      );
    };

    if (userData) {
      // If logged in, fetch repositories before rendering App
      (appStore.dispatch as ThunkDispatch<any, void, AnyAction>)(
        fetchObjects({ objectType: OBJECT_TYPES.REPOSITORY, reset: true }),
      ).finally(() => {
        const state = appStore.getState();
        const repos = selectRepositories(state);
        const user = selectUserState(state);
        // If user has no repos and is currently fetching repos, update state
        // to show spinner instead of empty repos-list.
        if (user?.currently_fetching_repos && !repos.length) {
          appStore.dispatch(reposRefreshing());
        }
        renderApp();
      });
    } else {
      renderApp();
    }
  }
});
