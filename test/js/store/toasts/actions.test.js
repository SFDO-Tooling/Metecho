import * as actions from '@/js/store/toasts/actions';

describe('addToast', () => {
  test('returns AddToastAction', () => {
    const actual = actions.addToast({ heading: 'message' });

    expect(actual.type).toBe('TOAST_ADDED');
    expect(typeof actual.payload.id).toBe('string');
    expect(actual.payload.heading).toBe('message');
  });
});

describe('removeToast', () => {
  test('returns RemoveToastAction', () => {
    const expected = { type: 'TOAST_REMOVED', payload: 'id' };
    const actual = actions.removeToast('id');

    expect(actual).toEqual(expected);
  });
});

describe('clearToasts', () => {
  test('returns ClearToastsAction', () => {
    const expected = { type: 'TOASTS_CLEARED' };
    const actual = actions.clearToasts();

    expect(actual).toEqual(expected);
  });
});
