import reducer from '@/js/store/toasts/reducer';

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
      variant: 'error',
    };
    const actual = reducer([], {
      type: 'TOAST_ADDED',
      payload: msg,
    });

    expect(actual).toEqual([msg]);
  });

  test('removes existing "success" toasts if new one is added', () => {
    const toast1 = {
      id: 'toast-1',
      heading: 'message',
    };
    const toast2 = {
      id: 'toast-2',
      heading: 'message',
      variant: 'success',
    };
    const toast3 = {
      id: 'toast-3',
      heading: 'message',
      variant: 'error',
    };
    const newToast = {
      id: 'new-toast',
      heading: 'message',
      variant: 'success',
    };
    const actual = reducer([toast1, toast2, toast3], {
      type: 'TOAST_ADDED',
      payload: newToast,
    });
    const expected = [toast3, newToast];

    expect(actual).toEqual(expected);
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
