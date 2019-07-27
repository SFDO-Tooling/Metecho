import React from 'react';

import Footer from '@/components/footer';

import { renderWithRedux } from './../utils';

describe('<Footer />', () => {
  describe('logged in', () => {
    test('renders logo with `backgroundImage` set to `logoSrc`', () => {
      const { getByTestId } = renderWithRedux(
        <Footer logoSrc="my/logo.png" />,
        {
          user: {},
        },
      );
      expect(getByTestId('footer-logo')).toHaveStyle(
        'background-image: url(my/logo.png)',
      );
    });
  });

  describe('logged out', () => {
    test('renders nothing', () => {
      const { queryByText } = renderWithRedux(<Footer />);

      expect(queryByText('Log In')).toBeNull();
    });
  });
});
