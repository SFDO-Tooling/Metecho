import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import { RouteComponentProps } from 'react-router-dom';
import { withRouter } from 'react-router';

import { addUrlParams } from 'utils/api';
import { logError } from 'utils/logging';

interface Props {
  id?: string;
  label?: string | React.ReactElement;
  from?: { pathname: string };
}

class UnwrappedLoginButton extends React.Component<
  Props & RouteComponentProps
> {
  public constructor(props: Props & RouteComponentProps) {
    super(props);
    if (!window.api_urls.github_login) {
      logError('Login URL not found for GitHub provider.');
    }
  }

  private handleClick = () => {
    /* istanbul ignore else */
    if (window.api_urls.github_login) {
      const { location } = this.props;
      let { from } = location.state || this.props;
      if (!from || !from.pathname) {
        from = { pathname: window.location.pathname };
      }
      window.location.assign(
        addUrlParams(window.api_urls.github_login(), {
          next: from.pathname,
        }),
      );
    }
  };

  public render() {
    const { id, label } = this.props;
    return (
      <Button
        id={id || 'login'}
        label={label === undefined ? i18n.t('Log In With GitHub') : label}
        variant="brand"
        disabled={!window.api_urls.github_login}
        onClick={this.handleClick}
      />
    );
  }
}

export const LoginButton = withRouter(UnwrappedLoginButton);

const Login = () => (
  <div className="slds-align_absolute-center">
    <div
      className="slds-text-longform
        slds-p-around_x-large"
    >
      <h1 className="slds-text-heading_large">
        {i18n.t('Welcome to MetaShare!')}
      </h1>
      <p>
        This is a stub. It will eventually be replaced with an{' '}
        <a href="https://www.lightningdesignsystem.com/components/welcome-mat/">
          SLDS Welcome Mat Component
        </a>{' '}
        once the{' '}
        <a href="https://github.com/salesforce/design-system-react/issues/1876">
          React implementation
        </a>{' '}
        is complete.
      </p>
      <LoginButton />
    </div>
  </div>
);

export default Login;
