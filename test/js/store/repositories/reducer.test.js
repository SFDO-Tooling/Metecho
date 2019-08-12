import reducer from '@/store/repositories/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = { repositories: [], next: null, notFound: [] };
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const repository1 = {
      id: 'p1',
      slug: 'repository-1',
      name: 'Repository 1',
      description: 'This is a test repository.',
    };
    const expected = { repositories: [], next: null, notFound: [] };
    const actual = reducer(
      {
        repositories: [repository1],
        next: 'next-url',
        notFound: ['repository-1'],
      },
      { type: 'USER_LOGGED_OUT' },
    );

    expect(actual).toEqual(expected);
  });

  describe('FETCH_OBJECTS_SUCCEEDED', () => {
    test('resets repositories list if `reset: true`', () => {
      const repository1 = {
        id: 'p1',
        slug: 'repository-1',
        name: 'Repository 1',
        description: 'This is a test repository.',
      };
      const repository2 = {
        id: 'p2',
        slug: 'repository-2',
        name: 'Repository 2',
        description: 'This is another test repository.',
      };
      const expected = { repositories: [repository2], next: 'next-url' };
      const actual = reducer(
        { repositories: [repository1], next: null },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [repository2], next: 'next-url' },
            objectType: 'repository',
            reset: true,
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('adds to repositories list if `reset: false`', () => {
      const mockRepositories = {
        notFound: [],
        repositories: [
          {
            id: 'repository1',
            slug: 'repository-1',
            name: 'Repository 1',
          },
        ],
        next: null,
      };
      const fetchedRepository = {
        id: 'repository2',
        slug: 'repository-2',
        name: 'Repository 2',
      };
      const expected = {
        ...mockRepositories,
        repositories: [...mockRepositories.repositories, fetchedRepository],
      };
      const actual = reducer(mockRepositories, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: { results: [fetchedRepository], next: null },
          objectType: 'repository',
          reset: false,
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "repository"', () => {
      const repository = {
        id: 'p1',
        slug: 'repository-1',
        name: 'Repository 1',
      };
      const expected = { repositories: [repository], next: 'next-url' };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: { results: [], next: null },
          objectType: 'other-object',
          reset: true,
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('FETCH_OBJECT_SUCCEEDED', () => {
    test('adds repository', () => {
      const repository1 = {
        id: 'p1',
        slug: 'repository-1',
        name: 'Repository 1',
      };
      const repository2 = {
        id: 'p2',
        slug: 'repository-2',
        name: 'Repository 2',
      };
      const expected = { repositories: [repository1, repository2] };
      const actual = reducer(
        { repositories: [repository1] },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: repository2,
            filters: { slug: 'repository-2' },
            objectType: 'repository',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores id of missing repository', () => {
      const repository1 = {
        id: 'p1',
        slug: 'repository-1',
        name: 'Repository 1',
      };
      const expected = {
        repositories: [repository1],
        notFound: ['repository-2', 'repository-3'],
      };
      const actual = reducer(
        { repositories: [repository1], notFound: ['repository-2'] },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: null,
            filters: { slug: 'repository-3' },
            objectType: 'repository',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores duplicate repository', () => {
      const repository1 = {
        id: 'p1',
        slug: 'repository-1',
        name: 'Repository 1',
      };
      const expected = {
        repositories: [repository1],
        notFound: ['repository-2'],
      };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: repository1,
          filters: { slug: 'repository-1' },
          objectType: 'repository',
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "repository"', () => {
      const repository = {
        id: 'p1',
        slug: 'repository-1',
        name: 'Repository 1',
      };
      const repository2 = {
        id: 'p2',
        slug: 'repository-2',
        name: 'Repository 2',
      };
      const expected = { repositories: [repository], next: null };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: repository2,
          filters: { slug: 'repository-2' },
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(expected);
    });
  });
});
