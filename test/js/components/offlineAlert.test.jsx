import { fireEvent } from '@testing-library/react';
import React from 'react';

import OfflineAlert from '~js/components/offlineAlert';

import { render } from './../utils';

describe('<OfflineAlert />', () => {
  let location;
  const setup = () => {
    const { getByText } = render(<OfflineAlert />);
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
