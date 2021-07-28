import React from 'react';

import { LabelWithSpinner } from '@/js/components/utils';

import { render } from './../../utils';

describe('<LabelWithSpinner />', () => {
  test('renders with defaults', () => {
    const { getByText } = render(<LabelWithSpinner label="testing" />);

    expect(getByText('testing')).toBeVisible();
  });
});
