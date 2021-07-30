import reducer from '@/js/store/errors/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = [];
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles ERROR_ADDED action', () => {
    const err = {
      id: 'err1',
      message: 'error message',
    };
    const actual = reducer([], {
      type: 'ERROR_ADDED',
      payload: err,
    });

    expect(actual).toEqual([err]);
  });

  test('handles ERROR_REMOVED action', () => {
    const err1 = {
      id: 'err1',
      message: 'error message',
    };
    const err2 = { id: 'err2', message: 'other error message' };
    const initial = [err1, err2];
    const expected = [err2];
    const actual = reducer(initial, { type: 'ERROR_REMOVED', payload: 'err1' });

    expect(actual).toEqual(expected);
  });

  test('handles ERRORS_CLEARED action', () => {
    const initial = [
      {
        id: 'err1',
        message: 'error message',
      },
    ];
    const actual = reducer(initial, { type: 'ERRORS_CLEARED' });

    expect(actual).toEqual([]);
  });
});
