import { render } from '@testing-library/react';
import React from 'react';

import ProjectProgress from '@/components/projects/progress';

describe('<ProjectProgress />', () => {
  test.each([
    ['0 of 0 Complete', [0, 0]],
    ['0 of 1 Complete', [0, 1]],
    ['1 of 2 Complete', [1, 2]],
    ['2 of 2 Complete', [2, 2]],
  ])('renders steps from project status: %s', (name, range) => {
    const { getByText } = render(<ProjectProgress range={range} />);

    expect(getByText(name)).toBeVisible();
  });
});
