import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

import { selectUserState } from '@/store/user/selectors';
import routes from '@/utils/routes';

const PrivateRoute = ({
  component: Component,
  ...rest
}: {
  component: ComponentType<any>;
  [key: string]: any;
}) => {
  const user = useSelector(selectUserState);

  return (
    <Route
      {...rest}
      render={(props) =>
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
};

export default PrivateRoute;
