import reducer from '@/store';

describe('reducer', () => {
  test('combines child reducers', () => {
    const actual = reducer(undefined, {});

    expect(Object.keys(actual).sort()).toEqual(
      [
        'errors',
        'orgs',
        'projects',
        'repositories',
        'socket',
        'tasks',
        'user',
      ].sort(),
    );
  });
});
