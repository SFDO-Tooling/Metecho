import { fireEvent } from '@testing-library/react';
import React from 'react';

import Errors from '@/js/components/apiErrors';
import { removeError } from '@/js/store/errors/actions';

import { renderWithRedux } from './../utils';

jest.mock('@/js/store/errors/actions');

removeError.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  removeError.mockClear();
});

describe('<Errors />', () => {
  let location;
  const setup = () => {
    const errors = [{ id: 'err1', message: 'This is an error.' }];
    const { getByText } = renderWithRedux(<Errors />, { errors });
    return { getByText };
  };

  beforeAll(() => {
    location = window.location;
    delete window.location;
    window.location = {
      reload: jest.fn(),
    };
  });

  afterAll(() => {
    window.location = location;
  });

  test('calls window.location.reload on link click', () => {
    const { getByText } = setup();
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
