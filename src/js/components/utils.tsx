import * as React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { connect } from 'react-redux';

import routes from 'utils/routes';
import { AppState } from 'store';
import { User } from 'store/user/reducer';
import { selectUserState } from 'store/user/selectors';

interface TransientMessageState {
  transientMessageVisible: boolean;
}
export interface TransientMessageProps {
  transientMessageVisible?: boolean;
  showTransientMessage?: () => void;
  hideTransientMessage?: () => void;
}

export const withTransientMessage = function<Props>(
  WrappedComponent: React.ComponentType<Props & TransientMessageProps>,
  options: { duration?: number },
) {
  const defaults = {
    duration: 5 * 1000,
  };
  const opts = { ...defaults, ...options };

  return class WithTransientMessage extends React.Component<
    Props,
    TransientMessageState
  > {
    private timeout: NodeJS.Timeout | undefined | null;

    public constructor(props: Props) {
      super(props);
      this.state = { transientMessageVisible: false };
      this.timeout = null;
    }

    public componentWillUnmount() {
      this.clearTimeout();
    }

    private clearTimeout() {
      if (this.timeout !== undefined && this.timeout !== null) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
    }

    private showTransientMessage = () => {
      this.setState({ transientMessageVisible: true });
      this.clearTimeout();
      this.timeout = setTimeout(() => {
        this.hideTransientMessage();
      }, opts.duration);
    };

    private hideTransientMessage = () => {
      this.setState({ transientMessageVisible: false });
      this.clearTimeout();
    };

    public render() {
      return (
        <WrappedComponent
          {...this.props}
          transientMessageVisible={this.state.transientMessageVisible}
          showTransientMessage={this.showTransientMessage}
          hideTransientMessage={this.hideTransientMessage}
        />
      );
    }
  };
};

const UnwrappedPrivateRoute = ({
  component: Component,
  user,
  ...rest
}: {
  component: React.ComponentType<any>;
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
