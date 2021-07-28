import React from 'react';

import Path from '@/js/components/path';

import { render } from './../utils';

describe('<Path />', () => {
  const steps = ['First', 'Second', 'Third', 'Fourth'];

  test('renders list of steps', () => {
    const { container } = render(<Path steps={steps} />);

    expect(container).toMatchSnapshot();
  });

  test('renders completed list of steps', () => {
    const { container } = render(
      <Path steps={steps} activeIdx={3} isCompleted />,
    );

    expect(container).toMatchSnapshot();
  });
});
