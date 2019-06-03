import React from 'react';
import { render } from 'react-testing-library';

import Footer from 'components/footer';

describe('<Footer />', () => {
  test('renders logo with `backgroundImage` set to `logoSrc`', () => {
    const { getByTestId } = render(<Footer logoSrc="my/logo.png" />);
    expect(getByTestId('footer-logo')).toHaveStyle(
      'background-image: url(my/logo.png)',
    );
  });
});
