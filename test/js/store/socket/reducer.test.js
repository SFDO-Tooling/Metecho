import reducer from '@/js/store/socket/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = false;
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles SOCKET_DISCONNECTED action', () => {
    const initial = null;
    const expected = false;
    const actual = reducer(initial, {
      type: 'SOCKET_DISCONNECTED',
      payload: expected,
    });

    expect(actual).toEqual(expected);
  });

  test('handles SOCKET_CONNECTED action', () => {
    const initial = null;
    const expected = true;
    const actual = reducer(initial, { type: 'SOCKET_CONNECTED' });

    expect(actual).toEqual(expected);
  });
});
