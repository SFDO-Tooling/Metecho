import { render } from '@testing-library/react';
import React from 'react';

import Path from '@/components/path';

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
