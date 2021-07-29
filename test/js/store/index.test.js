import reducer from '@/js/store';

describe('reducer', () => {
  test('combines child reducers', () => {
    const actual = reducer(undefined, {});

    expect(Object.keys(actual).sort()).toEqual(
      [
        'toasts',
        'errors',
        'orgs',
        'epics',
        'projects',
        'socket',
        'tasks',
        'user',
      ].sort(),
    );
  });
});
