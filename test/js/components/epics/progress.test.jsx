import React from 'react';

import EpicProgress from '@/js/components/epics/progress';

import { renderWithRedux } from './../../utils';

describe('<EpicProgress />', () => {
  test.each([
    ['0 of 0 Complete', [0, 0]],
    ['0 of 1 Complete', [0, 1]],
    ['1 of 2 Complete', [1, 2]],
    ['2 of 2 Complete', [2, 2]],
  ])('renders steps from epic status: %s', (name, range) => {
    const { getByText } = renderWithRedux(<EpicProgress range={range} />);

    expect(getByText(name)).toBeVisible();
  });
});
