import reducer from '@/store/toasts/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = [];
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles TOAST_ADDED action', () => {
    const msg = {
      id: 'toast-1',
      heading: 'message',
    };
    const actual = reducer([], {
      type: 'TOAST_ADDED',
      payload: msg,
    });

    expect(actual).toEqual([msg]);
  });

  test('handles TOAST_REMOVED action', () => {
    const msg1 = {
      id: 'toast-1',
      heading: 'message',
    };
    const msg2 = { id: 'toast-2', heading: 'other message' };
    const initial = [msg1, msg2];
    const expected = [msg2];
    const actual = reducer(initial, {
      type: 'TOAST_REMOVED',
      payload: 'toast-1',
    });

    expect(actual).toEqual(expected);
  });

  test('handles TOASTS_CLEARED action', () => {
    const initial = [
      {
        id: 'toast-1',
        heading: 'message',
      },
    ];
    const actual = reducer(initial, { type: 'TOASTS_CLEARED' });

    expect(actual).toEqual([]);
  });
});
