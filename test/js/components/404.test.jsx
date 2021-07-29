import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import FourOhFour from '@/js/components/404';

import { render } from './../utils';

describe('<404 />', () => {
  test('renders default msg with link', () => {
    const { getByText } = render(
      <MemoryRouter>
        <FourOhFour />
      </MemoryRouter>,
    );

    expect(getByText('home page')).toBeVisible();
  });

  test('renders with custom message', () => {
    const { getByText } = render(<FourOhFour message="This is custom" />);

    expect(getByText('This is custom')).toBeVisible();
  });
});
