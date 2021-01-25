import { render } from '@testing-library/react';
import React from 'react';

import { LabelWithSpinner } from '~js/components/utils';

describe('<LabelWithSpinner />', () => {
  test('renders with defaults', () => {
    const { getByText } = render(<LabelWithSpinner label="testing" />);

    expect(getByText('testing')).toBeVisible();
  });
});
