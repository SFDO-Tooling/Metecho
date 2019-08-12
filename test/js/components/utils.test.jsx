import { render } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import { LabelWithSpinner, PrivateRoute, useForm } from '@/components/utils';
import { createObject } from '@/store/actions';
import routes from '@/utils/routes';

import { renderHookWithRedux, renderWithRedux } from './../utils';

jest.mock('@/store/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  createObject.mockClear();
});

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

describe('<LabelWithSpinner />', () => {
  test('renders with defaults', () => {
    const { getByText } = render(<LabelWithSpinner label="testing" />);

    expect(getByText('testing')).toBeVisible();
  });
});

describe('useForm', () => {
  test('creates a new object', () => {
    const { result } = renderHookWithRedux(() =>
      useForm({ fields: { testing: '' }, objectType: 'test-type' }),
    );
    result.current.handleSubmit({ preventDefault: jest.fn() });

    expect(createObject).toHaveBeenCalledWith({
      objectType: 'test-type',
      data: {
        testing: '',
      },
    });
  });
});
