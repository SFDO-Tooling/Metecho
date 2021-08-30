import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route, RouteProps } from 'react-router-dom';

import { selectUserState } from '@/js/store/user/selectors';
import routes from '@/js/utils/routes';

const PrivateRoute = ({
  component: Component,
  ...rest
}: {
  component: ComponentType<any>;
  [key: string]: any;
} & RouteProps) => {
  const user = useSelector(selectUserState);

  return (
    <Route
      {...rest}
      render={(props) => {
        if (user) {
          return user.agreed_to_tos_at ||
            !window.GLOBALS?.SITE?.clickthrough_agreement ? (
            <Component {...props} />
          ) : (
            <Redirect
              to={{
                pathname: routes.terms(),
                state: { from: props.location },
              }}
            />
          );
        }
        return (
          <Redirect
            to={{
              pathname: routes.login(),
              state: { from: props.location },
            }}
          />
        );
      }}
    />
  );
};

export default PrivateRoute;
