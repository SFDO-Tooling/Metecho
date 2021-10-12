import React from 'react';
import { StaticRouter } from 'react-router-dom';

import { PrivateRoute } from '@/js/components/utils';
import routes from '@/js/utils/routes';

import { renderWithRedux } from './../../utils';

describe('<PrivateRoute />', () => {
  const Component = () => <div>Hi!</div>;

  const setup = (state = { user: null }) => {
    const context = {};
    const { getByText, queryByText } = renderWithRedux(
      <StaticRouter context={context}>
        <PrivateRoute path="/" component={Component} />
      </StaticRouter>,
      state,
    );
    return { getByText, queryByText, context };
  };

  let SITE;

  beforeAll(() => {
    SITE = window.GLOBALS.SITE;
    window.GLOBALS.SITE = {
      clickthrough_agreement: 'Resistance is futile.',
    };
  });

  afterAll(() => {
    window.GLOBALS.SITE = SITE;
  });

  test('renders component if logged in and agreed to TOS', () => {
    const { getByText } = setup({
      user: { agreed_to_tos_at: '2019-02-01T19:47:49Z' },
    });

    expect(getByText('Hi!')).toBeVisible();
  });

  test('redirects to terms if not agreed to', () => {
    const { context, queryByText } = setup({
      user: { agreed_to_tos_at: null },
    });

    expect(context.action).toBe('REPLACE');
    expect(context.url).toEqual(routes.terms());
    expect(queryByText('Hi!')).toBeNull();
  });

  test('redirects to login if not logged in', () => {
    const { context, queryByText } = setup();

    expect(context.action).toBe('REPLACE');
    expect(context.url).toEqual(routes.login());
    expect(queryByText('Hi!')).toBeNull();
  });
});
