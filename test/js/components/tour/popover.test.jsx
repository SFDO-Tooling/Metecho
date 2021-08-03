import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import TourPopover from '@/js/components/tour/popover';
import { updateTour } from '@/js/store/user/actions';

import { renderWithRedux, storeWithThunk } from '../../utils';

jest.mock('@/js/store/user/actions');
updateTour.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  updateTour.mockClear();
});

describe('<TourPopover />', () => {
  const setup = (state = {}, props = {}) =>
    renderWithRedux(
      <MemoryRouter>
        <TourPopover {...props} />
      </MemoryRouter>,
      state,
      storeWithThunk,
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
    });
    const btn = getByRole('button', { name: 'Learn More' });

    expect(btn).toBeVisible();
    expect(btn).not.toHaveClass('is-viewed');
  });

  test('renders viewed self-guided tour popover button', () => {
    const { getByRole } = setup(
      {
        user: {
          self_guided_tour_enabled: true,
          self_guided_tour_state: ['tour-popover-id'],
        },
      },
      { id: 'tour-popover-id' },
    );
    const btn = getByRole('button', { name: 'Learn More' });

    expect(btn).toBeVisible();
    expect(btn).toHaveClass('is-viewed');
  });

  test('hides self-guided tour popover when tour is disabled', () => {
    const { queryByText } = setup({
      user: { self_guided_tour_enabled: false },
    });

    expect(queryByText('Learn More', { exact: false })).toBeNull();
  });

  describe('on open', () => {
    test('calls updateTour action', () => {
      const user = {
        self_guided_tour_enabled: true,
        self_guided_tour_state: ['other-popover'],
      };
      const { getByRole } = setup({ user }, { id: 'tour-popover-id' });
      fireEvent.click(getByRole('button', { name: 'Learn More' }));

      expect(updateTour).toHaveBeenCalledTimes(1);
      expect(updateTour).toHaveBeenCalledWith({
        state: ['other-popover', 'tour-popover-id'],
      });
    });

    test('does not call updateTour action if already viewed', () => {
      const user = {
        self_guided_tour_enabled: true,
        self_guided_tour_state: ['tour-popover-id'],
      };
      const { getByRole } = setup({ user }, { id: 'tour-popover-id' });
      fireEvent.click(getByRole('button', { name: 'Learn More' }));

      expect(updateTour).not.toHaveBeenCalled();
    });

    test('handles missing self_guided_tour_state', () => {
      const user = { self_guided_tour_enabled: true };
      const { getByRole } = setup({ user }, { id: 'tour-popover-id' });
      fireEvent.click(getByRole('button', { name: 'Learn More' }));

      expect(updateTour).toHaveBeenCalledTimes(1);
      expect(updateTour).toHaveBeenCalledWith({
        state: ['tour-popover-id'],
      });
    });
  });
});
