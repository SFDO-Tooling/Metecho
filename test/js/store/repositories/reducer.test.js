import reducer from '@/store/repositories/reducer';

describe('reducer', () => {
  test('returns initial state if no action', () => {
    const expected = {
      repositories: [],
      next: null,
      notFound: [],
      refreshing: false,
    };
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test.each([['USER_LOGGED_OUT']])(
    'returns initial state on %s action',
    (action) => {
      const repository1 = {
        id: 'r1',
        slug: 'repository-1',
        name: 'Repository 1',
        description: 'This is a test repository.',
      };
      const expected = {
        repositories: [],
        next: null,
        notFound: [],
        refreshing: false,
      };
      const actual = reducer(
        {
          repositories: [repository1],
          next: 'next-url',
          notFound: ['repository-1'],
        },
        { type: action },
      );

      expect(actual).toEqual(expected);
    },
  );

  describe('REFRESH_REPOS_REQUESTED', () => {
    test('sets refreshing: true', () => {
      const expected = {
        repositories: [],
        next: null,
        notFound: [],
        refreshing: true,
      };
      const actual = reducer(
        {
          repositories: [],
          next: null,
          notFound: [],
          refreshing: false,
        },
        { type: 'REFRESH_REPOS_REQUESTED' },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESHING_REPOS', () => {
    test('sets refreshing: true', () => {
      const expected = {
        repositories: [],
        next: null,
        notFound: [],
        refreshing: true,
      };
      const actual = reducer(
        {
          repositories: [],
          next: null,
          notFound: [],
          refreshing: false,
        },
        { type: 'REFRESHING_REPOS' },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESH_REPOS_REJECTED', () => {
    test('sets refreshing: false', () => {
      const expected = {
        repositories: [],
        next: null,
        notFound: [],
        refreshing: false,
      };
      const actual = reducer(
        {
          repositories: [],
          next: null,
          notFound: [],
          refreshing: true,
        },
        { type: 'REFRESH_REPOS_REJECTED' },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('FETCH_OBJECTS_SUCCEEDED', () => {
    test('resets repositories list if `reset: true`', () => {
      const repository1 = {
        id: 'r1',
        slug: 'repository-1',
        name: 'Repository 1',
        description: 'This is a test repository.',
      };
      const repository2 = {
        id: 'r2',
        slug: 'repository-2',
        name: 'Repository 2',
        description: 'This is another test repository.',
      };
      const expected = {
        repositories: [repository2],
        next: 'next-url',
        refreshing: false,
      };
      const actual = reducer(
        { repositories: [repository1], next: null, refreshing: true },
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
        refreshing: false,
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
        id: 'r1',
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
        id: 'r1',
        slug: 'repository-1',
        name: 'Repository 1',
      };
      const repository2 = {
        id: 'r2',
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
        id: 'r1',
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
        id: 'r1',
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
        id: 'r1',
        slug: 'repository-1',
        name: 'Repository 1',
      };
      const repository2 = {
        id: 'r2',
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

  describe('REFRESH_GH_USERS_REQUESTED', () => {
    const repository = {
      id: 'r1',
      slug: 'repository-1',
      name: 'Repository 1',
    };
    const repository2 = {
      id: 'r2',
      slug: 'repository-2',
      name: 'Repository 2',
    };

    test('sets currently_refreshing_gh_users: true', () => {
      const expected = {
        repositories: [
          { ...repository, currently_refreshing_gh_users: true },
          repository2,
        ],
      };
      const actual = reducer(
        { repositories: [repository, repository2] },
        { type: 'REFRESH_GH_USERS_REQUESTED', payload: 'r1' },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if payload is not known repo id', () => {
      const expected = { repositories: [repository, repository2] };
      const actual = reducer(expected, {
        type: 'REFRESH_GH_USERS_REQUESTED',
        payload: 'unknown',
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESH_GH_USERS_REJECTED', () => {
    const repository = {
      id: 'r1',
      slug: 'repository-1',
      name: 'Repository 1',
      currently_refreshing_gh_users: true,
    };
    const repository2 = {
      id: 'r2',
      slug: 'repository-2',
      name: 'Repository 2',
    };

    test('sets currently_refreshing_gh_users: false', () => {
      const expected = {
        repositories: [
          { ...repository, currently_refreshing_gh_users: false },
          repository2,
        ],
      };
      const actual = reducer(
        { repositories: [repository, repository2] },
        { type: 'REFRESH_GH_USERS_REJECTED', payload: 'r1' },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('REPOSITORY_UPDATE', () => {
    const repository = {
      id: 'r1',
      slug: 'repository-1',
      name: 'Repository 1',
    };
    const repository2 = {
      id: 'r2',
      slug: 'repository-2',
      name: 'Repository 2',
    };

    test('updates known repository', () => {
      const changedRepo = {
        ...repository,
        name: 'Changed Repo',
      };
      const expected = {
        repositories: [changedRepo, repository2],
      };
      const actual = reducer(
        { repositories: [repository, repository2] },
        { type: 'REPOSITORY_UPDATE', payload: changedRepo },
      );

      expect(actual).toEqual(expected);
    });

    test('adds unknown repository', () => {
      const repository3 = {
        id: 'r3',
        slug: 'repository-3',
        name: 'Repository 3',
      };
      const expected = {
        repositories: [repository, repository2, repository3],
      };
      const actual = reducer(
        { repositories: [repository, repository2] },
        { type: 'REPOSITORY_UPDATE', payload: repository3 },
      );

      expect(actual).toEqual(expected);
    });
  });
});
