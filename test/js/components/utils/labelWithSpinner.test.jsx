import React from 'react';

import { LabelWithSpinner } from '_js/components/utils';

import { render } from './../../utils';

describe('<LabelWithSpinner />', () => {
  test('renders with defaults', () => {
    const { getByText } = render(<LabelWithSpinner label="testing" />);

    expect(getByText('testing')).toBeVisible();
  });
});
