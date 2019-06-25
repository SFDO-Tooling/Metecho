import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { render, fireEvent } from '@testing-library/react';

import { renderWithRedux } from './../utils';

import routes from 'utils/routes';
import { PrivateRoute, withTransientMessage } from 'components/utils';

describe('withTransientMessage', () => {
  /* eslint-disable react/prop-types */
  const Component = props => (
    <div>
      <div>{props.transientMessageVisible ? 'My Message' : ''}</div>
      <button onClick={props.showTransientMessage}>Show</button>
      <button onClick={props.hideTransientMessage}>Hide</button>
    </div>
  );
  /* eslint-enable react/prop-types */

  const setup = () => {
    const Wrapped = withTransientMessage(Component);
    const { getByText, queryByText } = render(<Wrapped />);
    return { getByText, queryByText };
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  test('shows message', () => {
    const { getByText, queryByText } = setup();

    expect(queryByText('My Message')).toBeNull();

    fireEvent.click(getByText('Show'));

    expect(getByText('My Message')).toBeVisible();
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);

    jest.runAllTimers();

    expect(queryByText('My Message')).toBeNull();
  });

  test('hides message', () => {
    const { getByText, queryByText } = setup();

    expect(queryByText('My Message')).toBeNull();

    fireEvent.click(getByText('Show'));

    expect(getByText('My Message')).toBeVisible();

    fireEvent.click(getByText('Hide'));

    expect(queryByText('My Message')).toBeNull();
  });
});

describe('<PrivateRoute />', () => {
  const Component = () => <div>Hi!</div>;

  const setup = (state = { user: null }) => {
    const context = {};
    const { getByText, queryByText } = renderWithRedux(
      <StaticRouter context={context}>
        <PrivateRoute path="/" component={Component} />
      </StaticRouter>,
      state,
    );
    return { getByText, queryByText, context };
  };

  test('renders component if logged in', () => {
    const { getByText } = setup({ user: {} });

    expect(getByText('Hi!')).toBeVisible();
  });

  test('redirects if not logged in', () => {
    const { context, queryByText } = setup();

    expect(context.action).toEqual('REPLACE');
    expect(context.url).toEqual(routes.login());
    expect(queryByText('Hi!')).toBeNull();
  });
});
