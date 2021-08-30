import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import Terms from '@/js/components/terms';
import { agreeToTerms, logout } from '@/js/store/user/actions';

import { renderWithRedux, storeWithThunk } from './../utils';

jest.mock('@/js/store/user/actions');

agreeToTerms.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
logout.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  agreeToTerms.mockClear();
  logout.mockClear();
});

describe('<Terms/>', () => {
  const setup = (state = {}, props = {}) => {
    const defaultState = {
      user: { id: 'my-user' },
    };
    const initialState = Object.assign({}, defaultState, state);
    const context = {};
    return {
      context,
      ...renderWithRedux(
        <StaticRouter context={context}>
          <Terms {...props} />
        </StaticRouter>,
        initialState,
        storeWithThunk,
      ),
    };
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

  test('redirects if already agreed to TOS', () => {
    const { context, queryByText } = setup(
      {
        user: { agreed_to_tos_at: '2019-02-01T19:47:49Z' },
      },
      { from: { pathname: '/foo/bar' } },
    );

    expect(context.action).toEqual('REPLACE');
    expect(context.url).toEqual('/foo/bar');
    expect(queryByText('Metecho Terms of Service')).toBeNull();
  });

  describe('cancel button', () => {
    test('logs out', () => {
      const { getByText } = setup();

      expect(getByText('Metecho Terms of Service')).toBeVisible();
      expect(getByText('Cancel and Log Out')).toBeVisible();

      fireEvent.click(getByText('Cancel and Log Out'));

      expect(logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('submit buttom', () => {
    test('PUTs to API', async () => {
      const { findByText, getByText } = setup();

      expect.assertions(4);
      expect(getByText('Metecho Terms of Service')).toBeVisible();
      expect(getByText('Resistance is futile.')).toBeVisible();
      expect(getByText('I Agree')).toBeVisible();

      fireEvent.click(getByText('I Agree'));
      await findByText('Saving…');

      expect(agreeToTerms).toHaveBeenCalledTimes(1);
    });
  });
});
