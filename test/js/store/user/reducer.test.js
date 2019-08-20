import reducer from '@/store/user/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = null;
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_IN action', () => {
    const initial = null;
    const expected = { username: 'Test User' };
    const actual = reducer(initial, {
      type: 'USER_LOGGED_IN',
      payload: expected,
    });

    expect(actual).toEqual(expected);
  });

  test('handles USER_DISCONNECT_SUCCEEDED action', () => {
    const initial = null;
    const expected = { username: 'Test User' };
    const actual = reducer(initial, {
      type: 'USER_DISCONNECT_SUCCEEDED',
      payload: expected,
    });

    expect(actual).toEqual(expected);
  });

  test('handles DEV_HUB_STATUS_SUCCEEDED action', () => {
    const initial = null;
    const expected = { username: 'Test User' };
    const actual = reducer(initial, {
      type: 'DEV_HUB_STATUS_SUCCEEDED',
      payload: expected,
    });

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const initial = { username: 'Test User' };
    const expected = null;
    const actual = reducer(initial, { type: 'USER_LOGGED_OUT' });

    expect(actual).toEqual(expected);
  });
});
