import { fireEvent } from '@testing-library/react';
import React from 'react';

import Logout from '@/components/user/logout';
import { logout } from '@/store/user/actions';

import { renderWithRedux } from './../../utils';

jest.mock('@/store/user/actions');

logout.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  logout.mockClear();
});

describe('<Logout />', () => {
  const setup = () => renderWithRedux(<Logout />);

  test('calls logout on click', () => {
    const { getByText } = setup();
    fireEvent.click(getByText('Log Out of GitHub'));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
