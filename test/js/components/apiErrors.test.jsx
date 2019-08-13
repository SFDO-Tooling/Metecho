import { fireEvent } from '@testing-library/react';
import React from 'react';

import Errors from '@/components/apiErrors';
import { removeError } from '@/store/errors/actions';

import { renderWithRedux } from './../utils';

jest.mock('@/store/errors/actions');

removeError.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  removeError.mockClear();
});

describe('<Errors />', () => {
  const setup = () => {
    const errors = [{ id: 'err1', message: 'This is an error.' }];
    const { getByText } = renderWithRedux(<Errors />, { errors });
    return { getByText };
  };

  test('calls window.location.reload on link click', () => {
    const { getByText } = setup();

    jest.spyOn(window.location, 'reload');
    fireEvent.click(getByText('reload the page.'));

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  test('calls removeError on close click', () => {
    const { getByText } = setup();
    fireEvent.click(getByText('Close'));

    expect(removeError).toHaveBeenCalledTimes(1);
    expect(removeError).toHaveBeenCalledWith('err1');
  });
});
