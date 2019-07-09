import Spinner from '@salesforce/design-system-react/components/spinner';
import React, { ComponentType } from 'react';
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
