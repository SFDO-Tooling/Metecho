import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import FourOhFour from '@/components/404';

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
