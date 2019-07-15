import Spinner from '@salesforce/design-system-react/components/spinner';
import React, { ComponentType, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

import { AppState } from '@/store';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import routes from '@/utils/routes';

const UnwrappedPrivateRoute = ({
  component: Component,
  user,
  ...rest
}: {
  component: ComponentType<any>;
  user: User | null;
  [key: string]: any;
}) => (
  <Route
    {...rest}
    render={props =>
      user ? (
        <Component {...props} />
      ) : (
        <Redirect
          to={{
            pathname: routes.login(),
            state: { from: props.location },
          }}
        />
      )
    }
  />
);

const select = (appState: AppState) => ({
  user: selectUserState(appState),
});

export const PrivateRoute = connect(select)(UnwrappedPrivateRoute);

// This is often considered an anti-pattern in React, but it's acceptable in
// cases where we don't want to cancel or cleanup an asynchronous action on
// unmount -- we just want to prevent a post-unmount state update after the
// action finishes.
// https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
export const useIsMounted = () => {
  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );
  return isMounted;
};

// For use as a "loading" button label
export const LabelWithSpinner = ({
  label,
  variant = 'inverse',
  size = 'small',
}: {
  label: string;
  variant?: string;
  size?: string;
}) => (
  <>
    <span className="slds-is-relative slds-m-right_large">
      <Spinner variant={variant} size={size} />
    </span>
    {label}
  </>
);
