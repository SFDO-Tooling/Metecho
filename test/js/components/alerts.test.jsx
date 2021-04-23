import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import Alerts from '~js/components/alerts';

import { renderWithRedux } from './../utils';

describe('<Alerts />', () => {
  let location;
  const setup = (state = {}) =>
    renderWithRedux(
      <MemoryRouter>
        <Alerts />
      </MemoryRouter>,
      state,
    );

  describe('<OfflineAlert />', () => {
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

  describe('<TourAlert />', () => {
    let ENABLE_WALKTHROUGHS;

    beforeAll(() => {
      ENABLE_WALKTHROUGHS = window.GLOBALS.ENABLE_WALKTHROUGHS;
      window.GLOBALS.ENABLE_WALKTHROUGHS = true;
    });

    afterAll(() => {
      window.GLOBALS.ENABLE_WALKTHROUGHS = ENABLE_WALKTHROUGHS;
    });

    test('renders tour alert', () => {
      const { getByText } = setup({
        user: { self_guided_tour_enabled: true },
        projects: {},
      });

      expect(
        getByText('You are in self-guided tour mode', { exact: false }),
      ).toBeVisible();
    });

    test('hides tour alert on close click', () => {
      const { getByText, queryByText } = setup({
        user: { self_guided_tour_enabled: true },
        projects: {},
      });

      expect(
        getByText('You are in self-guided tour mode', { exact: false }),
      ).toBeVisible();

      fireEvent.click(getByText('Close'));

      expect(
        queryByText('You are in self-guided tour mode', { exact: false }),
      ).toBeNull();
    });
  });
});
