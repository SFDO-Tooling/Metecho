import { fireEvent } from '@testing-library/react';
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

    test('open/close terms of service', () => {
      const { getByText, queryByText } = renderWithRedux(
        <Footer logoSrc="my/logo.png" />,
        {
          user: {},
        },
      );
      fireEvent.click(getByText('Terms of Service'));

      expect(queryByText('Metecho Terms of Service')).toBeVisible();

      fireEvent.click(getByText('Close'));

      expect(queryByText('Metecho Terms of Service')).toBeNull();
    });
  });

  describe('logged out', () => {
    test('renders nothing', () => {
      const { queryByText } = renderWithRedux(<Footer />);

      expect(queryByText('Log In')).toBeNull();
    });
  });
});
