import reducer from '@/js/store/githubIssues/reducer';

describe('reducer', () => {
  test('returns initial state if no action', () => {
    const expected = {
      issues: [],
      notFound: [],
    };
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test.each([['USER_LOGGED_OUT']])(
    'returns initial state on %s action',
    (action) => {
      const issue = {
        id: 'i1',
        name: 'Issue 1',
      };
      const expected = {
        issues: [],
        notFound: [],
      };
      const actual = reducer(
        {
          issues: [issue],
          notFound: ['i2'],
        },
        { type: action },
      );

      expect(actual).toEqual(expected);
    },
  );

  describe('FETCH_OBJECT_SUCCEEDED', () => {
    test('adds issue', () => {
      const issue1 = {
        id: 'i1',
        name: 'issue 1',
      };
      const issue2 = {
        id: 'i2',
        name: 'issue 2',
      };
      const expected = { issues: [issue1, issue2] };
      const actual = reducer(
        { issues: [issue1] },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: issue2,
            filters: { id: 'i2' },
            objectType: 'issue',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores id of missing issue', () => {
      const issue1 = {
        id: 'i1',
        name: 'issue 1',
      };
      const expected = {
        issues: [issue1],
        notFound: ['i2', 'i3'],
      };
      const actual = reducer(
        { issues: [issue1], notFound: ['i2'] },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: null,
            filters: { id: 'i3' },
            objectType: 'issue',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores duplicate issue', () => {
      const issue1 = {
        id: 'i1',
        name: 'issue 1',
      };
      const expected = {
        issues: [issue1],
        notFound: ['i2'],
      };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: issue1,
          filters: { id: 'issue-1' },
          objectType: 'issue',
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "issue"', () => {
      const issue = {
        id: 'i1',
        name: 'issue 1',
      };
      const issue2 = {
        id: 'i2',
        name: 'issue 2',
      };
      const expected = { issues: [issue] };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: issue2,
          filters: { id: 'i2' },
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(expected);
    });
  });
});
