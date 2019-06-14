import * as React from 'react';

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
