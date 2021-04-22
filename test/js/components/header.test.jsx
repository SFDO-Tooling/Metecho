import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import Header from '~js/components/header';
import routes from '~js/utils/routes';

import { renderWithRedux } from './../utils';

describe('<Header />', () => {
  const setup = (
    initialState = {
      user: { username: 'Test User' },
      socket: false,
      errors: [],
    },
    routerProps = {},
  ) => {
    const context = {};
    return {
      ...renderWithRedux(
        <StaticRouter context={context} {...routerProps}>
          <Header />
        </StaticRouter>,
        initialState,
      ),
      context,
    };
  };

  describe('logged out', () => {
    test('renders nothing', () => {
      const { container } = setup({ user: null, socket: true });

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('offline', () => {
    test('renders OfflineAlert if websocket disconnected', () => {
      const { getByText } = setup();

      expect(getByText('reload the page.')).toBeVisible();
    });

    test('does not render OfflineAlert if websocket connected', () => {
      const initialState = { user: {}, socket: true };
      const { queryByText } = setup(initialState);

      expect(queryByText('reload the page.')).toBeNull();
    });
  });

  describe('walkthrough click', () => {
    let ENABLE_WALKTHROUGHS;

    beforeAll(() => {
      ENABLE_WALKTHROUGHS = window.GLOBALS.ENABLE_WALKTHROUGHS;
      window.GLOBALS.ENABLE_WALKTHROUGHS = true;
    });

    afterAll(() => {
      window.GLOBALS.ENABLE_WALKTHROUGHS = ENABLE_WALKTHROUGHS;
    });

    test('redirects to project detail', () => {
      const initialState = {
        user: {},
        projects: {
          projects: [
            {
              id: 'r1',
              name: 'Project 1',
              slug: 'project-1',
              old_slugs: [],
            },
          ],
          notFound: [],
          next: null,
        },
      };
      const url = routes.project_detail('project-1');
      const { getByText, getByTitle, context } = setup(initialState, {
        location: url,
      });
      fireEvent.click(getByText('Get Help'));
      fireEvent.click(getByTitle('Plan Walkthrough'));

      expect(context.action).toEqual('PUSH');
      expect(context.url).toEqual(url);
    });

    test('only renders self-guided tour in the dropdown if no project', () => {
      const initialState = {
        user: {},
        projects: {
          projects: [
            {
              id: 'r1',
              name: 'Project 1',
              slug: 'project-1',
              old_slugs: [],
            },
          ],
          notFound: [],
          next: null,
        },
      };
      const { queryByText } = setup(initialState);

      expect(queryByText('Plan Walkthrough')).toBeNull();
    });
  });
});
