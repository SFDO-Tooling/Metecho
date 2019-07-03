import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import Errors from '@/components/apiErrors';

describe('<Errors />', () => {
  const doRemoveError = jest.fn();

  const setup = () => {
    const errors = [{ id: 'err1', message: 'This is an error.' }];
    const { getByText } = render(
      <Errors errors={errors} doRemoveError={doRemoveError} />,
    );
    return { getByText };
  };

  test('calls window.location.reload on link click', () => {
    const { getByText } = setup();

    jest.spyOn(window.location, 'reload');
    fireEvent.click(getByText('reload the page.'));

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  test('calls doRemoveError on close click', () => {
    const { getByText } = setup();
    fireEvent.click(getByText('Close'));

    expect(doRemoveError).toHaveBeenCalledTimes(1);
    expect(doRemoveError).toHaveBeenCalledWith('err1');
  });
});
