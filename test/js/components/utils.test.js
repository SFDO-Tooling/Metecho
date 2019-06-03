import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import { withTransientMessage } from 'components/utils';

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
