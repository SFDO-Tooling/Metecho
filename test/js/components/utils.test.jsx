import React from 'react';
import { StaticRouter } from 'react-router-dom';

import { PrivateRoute } from '@/components/utils';
import routes from '@/utils/routes';

import { renderWithRedux } from './../utils';

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

  test('renders component if logged in', () => {
    const { getByText } = setup({ user: {} });

    expect(getByText('Hi!')).toBeVisible();
  });

  test('redirects if not logged in', () => {
    const { context, queryByText } = setup();

    expect(context.action).toEqual('REPLACE');
    expect(context.url).toEqual(routes.login());
    expect(queryByText('Hi!')).toBeNull();
  });
});
