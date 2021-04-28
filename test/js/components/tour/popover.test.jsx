import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import TourPopover from '~js/components/tour/popover';
import { updateTour } from '~js/store/user/actions';

import { renderWithRedux } from '../../utils';

jest.mock('~js/store/user/actions');
updateTour.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  updateTour.mockClear();
});

describe('<TourPopover />', () => {
  const setup = (state = {}) =>
    renderWithRedux(
      <MemoryRouter>
        <TourPopover />
      </MemoryRouter>,
      state,
    );

  let ENABLE_WALKTHROUGHS;

  beforeAll(() => {
    ENABLE_WALKTHROUGHS = window.GLOBALS.ENABLE_WALKTHROUGHS;
    window.GLOBALS.ENABLE_WALKTHROUGHS = true;
  });

  afterAll(() => {
    window.GLOBALS.ENABLE_WALKTHROUGHS = ENABLE_WALKTHROUGHS;
  });

  test('renders self-guided tour popover button', () => {
    const { getByRole } = setup({
      user: { self_guided_tour_enabled: true },
      projects: {},
    });

    expect(getByRole('button', { name: 'Learn More' })).toBeVisible();
  });

  test('hides self-guided tour popover when tour is disabled', () => {
    const { queryByText } = setup({
      user: { self_guided_tour_enabled: false },
      projects: {},
    });

    expect(queryByText('Learn More', { exact: false })).toBeNull();
  });
});
