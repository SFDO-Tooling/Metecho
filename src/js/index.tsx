import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import settings from '@salesforce/design-system-react/components/settings';
import actionSprite from '@salesforce-ux/design-system/assets/icons/action-sprite/svg/symbols.svg';
import customSprite from '@salesforce-ux/design-system/assets/icons/custom-sprite/svg/symbols.svg';
import doctypeSprite from '@salesforce-ux/design-system/assets/icons/doctype-sprite/svg/symbols.svg';
import standardSprite from '@salesforce-ux/design-system/assets/icons/standard-sprite/svg/symbols.svg';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';
import { createBrowserHistory } from 'history';
import React, { useEffect } from 'react';
import DocumentTitle from 'react-document-title';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
// Consider upgrading to v6: https://github.com/remix-run/react-router/discussions/8753
import {
  Redirect,
  Route,
  RouteComponentProps,
  Router,
  Switch,
  withRouter,
} from 'react-router-dom';
import {
  applyMiddleware,
  Dispatch,
  // Consider upgrading to Redux Toolkit: https://github.com/reduxjs/redux/releases/tag/v4.2.0
  legacy_createStore as createStore,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

import SFLogo from '@/img/salesforce-logo.png';
import FourOhFour from '@/js/components/404';
import EpicDetail from '@/js/components/epics/detail';
import ErrorBoundary from '@/js/components/error';
import Footer from '@/js/components/footer';
import Header from '@/js/components/header';
import ProjectDetail from '@/js/components/projects/detail';
import ProjectList from '@/js/components/projects/list';
import TaskDetail from '@/js/components/tasks/detail';
import Terms from '@/js/components/terms';
import AuthError from '@/js/components/user/authError';
import Login from '@/js/components/user/login';
import { PrivateRoute } from '@/js/components/utils';
import initializeI18n from '@/js/i18n';
import reducer, { ThunkDispatch } from '@/js/store';
import { fetchObjects } from '@/js/store/actions';
import { clearErrors } from '@/js/store/errors/actions';
import {
  projectsRefreshed,
  projectsRefreshing,
} from '@/js/store/projects/actions';
import { clearToasts } from '@/js/store/toasts/actions';
import { login, refetchAllData } from '@/js/store/user/actions';
import { User } from '@/js/store/user/reducer';
import { selectUserState } from '@/js/store/user/selectors';
import apiFetch from '@/js/utils/api';
import { OBJECT_TYPES } from '@/js/utils/constants';
import { log, logError } from '@/js/utils/logging';
import { routePatterns } from '@/js/utils/routes';
import { createSocket } from '@/js/utils/websockets';

const history = createBrowserHistory();

const App = withRouter(
  ({
    dispatch,
    location: { pathname },
  }: { dispatch: Dispatch } & RouteComponentProps) => {
    const { t } = useTranslation();

    useEffect(
      () => () => {
        dispatch(clearErrors());
        dispatch(clearToasts());
      },
      [dispatch, pathname],
    );

    return (
      <DocumentTitle title={t('Metecho')}>
        <div
          className="slds-grid
            slds-grid_frame
            slds-grid_vertical
            metecho-frame"
        >
          <ErrorBoundary>
            <Header />
            <div className="slds-grow slds-shrink-none">
              <ErrorBoundary>
                <Switch>
                  <Route exact path={routePatterns.login} component={Login} />
                  <Route exact path={routePatterns.terms} component={Terms} />
                  <Redirect
                    exact
                    from={routePatterns.home}
                    to={routePatterns.project_list}
                  />
                  <PrivateRoute
                    exact
                    path={routePatterns.project_list}
                    component={ProjectList}
                  />
                  <PrivateRoute
                    exact
                    path={routePatterns.project_detail}
                    component={ProjectDetail}
                  />
                  <PrivateRoute
                    exact
                    path={routePatterns.epic_detail}
                    component={EpicDetail}
                  />
                  <PrivateRoute
                    exact
                    path={routePatterns.project_task_detail}
                    component={TaskDetail}
                  />
                  <PrivateRoute
                    exact
                    path={routePatterns.epic_task_detail}
                    component={TaskDetail}
                  />
                  <Redirect
                    exact
                    from={routePatterns.old_epic_detail}
                    to={routePatterns.epic_detail}
                  />
                  <Redirect
                    exact
                    from={routePatterns.old_task_detail}
                    to={routePatterns.epic_task_detail}
                  />
                  <Route
                    path={routePatterns.auth_error}
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
      composeWithDevTools(
        applyMiddleware(thunk.withExtraArgument(history), logger),
      ),
    );

    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    window.socket = createSocket({
      url: `${protocol}//${host}${window.api_urls.ws_notifications()}`,
      dispatch: appStore.dispatch,
      options: {
        onreconnect: () => {
          (appStore.dispatch as ThunkDispatch)(refetchAllData());
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
    } catch (err: any) {
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
      const root = createRoot(el);
      root.render(
        <Provider store={appStore}>
          <Router history={history}>
            <IconSettings
              actionSprite={actionSprite}
              customSprite={customSprite}
              doctypeSprite={doctypeSprite}
              standardSprite={standardSprite}
              utilitySprite={utilitySprite}
            >
              <App dispatch={appStore.dispatch} />
            </IconSettings>
          </Router>
        </Provider>,
      );
    };

    const userFetching = () => {
      const user = selectUserState(appStore.getState());
      const fetching = new Set();
      if (user?.currently_fetching_repos) {
        fetching.add('currently_fetching_repos');
      }
      if (user?.currently_fetching_orgs) {
        fetching.add('currently_fetching_orgs');
      }
      return fetching;
    };

    if (userData) {
      // If logged in, fetch projects before rendering App
      (appStore.dispatch as ThunkDispatch)(
        fetchObjects({ objectType: OBJECT_TYPES.PROJECT, reset: true }),
      ).finally(() => {
        let fetching = userFetching();
        if (fetching.size) {
          // If user is currently fetching projects,
          // update state to show loading spinner.
          if (fetching.has('currently_fetching_repos')) {
            appStore.dispatch(projectsRefreshing());
          }
          // Because the refetch-projects/orgs jobs may complete before the
          // websocket channel subscription is finalized, poll every second
          // to check if jobs have finished:
          const POLLING_LIMIT = 10;
          let count = 0;
          const checkIfJobIsComplete = () => {
            window.setTimeout(() => {
              fetching = userFetching();
              if (fetching.size) {
                // Stop polling after 10 seconds
                if (count >= POLLING_LIMIT) {
                  if (fetching.has('currently_fetching_repos')) {
                    (appStore.dispatch as ThunkDispatch)(projectsRefreshed());
                  }
                  return;
                }
                count = count + 1;
                apiFetch({
                  url: window.api_urls.current_user_detail(),
                }).then((payload: User | null) => {
                  fetching = userFetching();
                  if (!fetching.size) {
                    // If the user is no longer fetching, the job(s) completed
                    // and a websocket message was already received.
                    return;
                  }

                  // If we are done fetching but did not receive a websocket,
                  // stop polling and trigger end-of-fetching action.
                  if (
                    fetching.has('currently_fetching_orgs') &&
                    !payload?.currently_fetching_orgs
                  ) {
                    appStore.dispatch({
                      type: 'USER_REFRESH_SUCCEEDED',
                      payload,
                    });
                  }
                  if (
                    fetching.has('currently_fetching_repos') &&
                    !payload?.currently_fetching_repos
                  ) {
                    (appStore.dispatch as ThunkDispatch)(projectsRefreshed());
                  }

                  if (
                    payload?.currently_fetching_repos ||
                    payload?.currently_fetching_orgs
                  ) {
                    checkIfJobIsComplete();
                  }
                });
              }
            }, 1000);
          };
          checkIfJobIsComplete();
        }
        renderApp();
      });
    } else {
      renderApp();
    }
  }
});
