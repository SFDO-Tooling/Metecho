import { fireEvent } from '@testing-library/react';
import React from 'react';

import Alerts from '~js/components/alerts';

import { render } from './../utils';

describe('<Alerts />', () => {
  let location;
  const setup = () => {
    const { getByText } = render(<Alerts />);
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

  test('calls window.location.reload on click', () => {
    const { getByText } = setup();
    fireEvent.click(getByText('reload the page.'));

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
