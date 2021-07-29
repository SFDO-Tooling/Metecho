import { fireEvent } from '@testing-library/react';
import React from 'react';

import Footer from '@/js/components/footer';

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

    describe('with terms of service', () => {
      let SITE;

      beforeAll(() => {
        SITE = window.GLOBALS.SITE;
        window.GLOBALS.SITE = {
          clickthrough_agreement: 'Resistance is futile.',
        };
      });

      afterAll(() => {
        window.GLOBALS.SITE = SITE;
      });

      test('can open/close terms of service', () => {
        const { getByText, getByTitle, queryByText } = renderWithRedux(
          <Footer />,
          {
            user: {},
          },
        );
        fireEvent.click(getByText('Terms of Service'));

        expect(queryByText('Metecho Terms of Service')).toBeVisible();

        fireEvent.click(getByTitle('Close'));

        expect(queryByText('Metecho Terms of Service')).toBeNull();
      });
    });
  });

  describe('logged out', () => {
    test('renders nothing', () => {
      const { queryByText } = renderWithRedux(<Footer />);

      expect(queryByText('Log In')).toBeNull();
    });
  });
});
