import reducer from '@/js/store/projects/reducer';

describe('reducer', () => {
  test('returns initial state if no action', () => {
    const expected = {
      projects: [],
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
      const project1 = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
        description: 'This is a test project.',
      };
      const expected = {
        projects: [],
        next: null,
        notFound: [],
        refreshing: false,
      };
      const actual = reducer(
        {
          projects: [project1],
          next: 'next-url',
          notFound: ['project-1'],
        },
        { type: action },
      );

      expect(actual).toEqual(expected);
    },
  );

  describe('REFRESH_PROJECTS_REQUESTED', () => {
    test('sets refreshing: true', () => {
      const expected = {
        projects: [],
        next: null,
        notFound: [],
        refreshing: true,
      };
      const actual = reducer(
        {
          projects: [],
          next: null,
          notFound: [],
          refreshing: false,
        },
        { type: 'REFRESH_PROJECTS_REQUESTED' },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESHING_PROJECTS', () => {
    test('sets refreshing: true', () => {
      const expected = {
        projects: [],
        next: null,
        notFound: [],
        refreshing: true,
      };
      const actual = reducer(
        {
          projects: [],
          next: null,
          notFound: [],
          refreshing: false,
        },
        { type: 'REFRESHING_PROJECTS' },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESH_PROJECTS_REJECTED', () => {
    test('sets refreshing: false', () => {
      const expected = {
        projects: [],
        next: null,
        notFound: [],
        refreshing: false,
      };
      const actual = reducer(
        {
          projects: [],
          next: null,
          notFound: [],
          refreshing: true,
        },
        { type: 'REFRESH_PROJECTS_REJECTED' },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('FETCH_OBJECTS_SUCCEEDED', () => {
    test('resets projects list if `reset: true`', () => {
      const project1 = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
        description: 'This is a test project.',
      };
      const project2 = {
        id: 'p2',
        slug: 'project-2',
        name: 'Project 2',
        description: 'This is another test project.',
      };
      const expected = {
        projects: [project2],
        next: 'next-url',
        refreshing: false,
      };
      const actual = reducer(
        { projects: [project1], next: null, refreshing: true },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [project2], next: 'next-url' },
            objectType: 'project',
            reset: true,
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('adds to projects list if `reset: false`', () => {
      const mockProjects = {
        notFound: [],
        projects: [
          {
            id: 'project1',
            slug: 'project-1',
            name: 'Project 1',
          },
        ],
        next: null,
        refreshing: false,
      };
      const fetchedProject = {
        id: 'project2',
        slug: 'project-2',
        name: 'Project 2',
      };
      const expected = {
        ...mockProjects,
        projects: [...mockProjects.projects, fetchedProject],
      };
      const actual = reducer(mockProjects, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: { results: [fetchedProject], next: null },
          objectType: 'project',
          reset: false,
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "project"', () => {
      const project = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
      };
      const expected = { projects: [project], next: 'next-url' };
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
    test('adds project', () => {
      const project1 = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
      };
      const project2 = {
        id: 'p2',
        slug: 'project-2',
        name: 'Project 2',
      };
      const expected = { projects: [project1, project2] };
      const actual = reducer(
        { projects: [project1] },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: project2,
            filters: { slug: 'project-2' },
            objectType: 'project',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores id of missing project', () => {
      const project1 = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
      };
      const expected = {
        projects: [project1],
        notFound: ['project-2', 'project-3'],
      };
      const actual = reducer(
        { projects: [project1], notFound: ['project-2'] },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: null,
            filters: { slug: 'project-3' },
            objectType: 'project',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores duplicate project', () => {
      const project1 = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
      };
      const expected = {
        projects: [project1],
        notFound: ['project-2'],
      };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: project1,
          filters: { slug: 'project-1' },
          objectType: 'project',
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "project"', () => {
      const project = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
      };
      const project2 = {
        id: 'p2',
        slug: 'project-2',
        name: 'Project 2',
      };
      const expected = { projects: [project], next: null };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: project2,
          filters: { slug: 'project-2' },
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESH_GH_USERS_REQUESTED', () => {
    const project = {
      id: 'p1',
      slug: 'project-1',
      name: 'Project 1',
    };
    const project2 = {
      id: 'p2',
      slug: 'project-2',
      name: 'Project 2',
    };

    test('sets currently_fetching_github_users: true', () => {
      const expected = {
        projects: [
          { ...project, currently_fetching_github_users: true },
          project2,
        ],
      };
      const actual = reducer(
        { projects: [project, project2] },
        { type: 'REFRESH_GH_USERS_REQUESTED', payload: 'p1' },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if payload is not known project id', () => {
      const expected = { projects: [project, project2] };
      const actual = reducer(expected, {
        type: 'REFRESH_GH_USERS_REQUESTED',
        payload: 'unknown',
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESH_GH_USERS_REJECTED', () => {
    const project = {
      id: 'p1',
      slug: 'project-1',
      name: 'Project 1',
      currently_fetching_github_users: true,
    };
    const project2 = {
      id: 'p2',
      slug: 'project-2',
      name: 'Project 2',
    };

    test('sets currently_fetching_github_users: false', () => {
      const expected = {
        projects: [
          { ...project, currently_fetching_github_users: false },
          project2,
        ],
      };
      const actual = reducer(
        { projects: [project, project2] },
        { type: 'REFRESH_GH_USERS_REJECTED', payload: 'p1' },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESH_ORG_CONFIGS_REQUESTED', () => {
    const project = {
      id: 'p1',
      slug: 'project-1',
      name: 'Project 1',
    };
    const project2 = {
      id: 'p2',
      slug: 'project-2',
      name: 'Project 2',
    };

    test('sets currently_fetching_org_config_names: true', () => {
      const expected = {
        projects: [
          { ...project, currently_fetching_org_config_names: true },
          project2,
        ],
      };
      const actual = reducer(
        { projects: [project, project2] },
        { type: 'REFRESH_ORG_CONFIGS_REQUESTED', payload: 'p1' },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if payload is not known project id', () => {
      const expected = { projects: [project, project2] };
      const actual = reducer(expected, {
        type: 'REFRESH_ORG_CONFIGS_REQUESTED',
        payload: 'unknown',
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESH_ORG_CONFIGS_REJECTED', () => {
    const project = {
      id: 'p1',
      slug: 'project-1',
      name: 'Project 1',
      currently_fetching_org_config_names: true,
    };
    const project2 = {
      id: 'p2',
      slug: 'project-2',
      name: 'Project 2',
    };

    test('sets currently_fetching_org_config_names: false', () => {
      const expected = {
        projects: [
          { ...project, currently_fetching_org_config_names: false },
          project2,
        ],
      };
      const actual = reducer(
        { projects: [project, project2] },
        { type: 'REFRESH_ORG_CONFIGS_REJECTED', payload: 'p1' },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('PROJECT_UPDATE', () => {
    const project = {
      id: 'p1',
      slug: 'project-1',
      name: 'Project 1',
    };
    const project2 = {
      id: 'p2',
      slug: 'project-2',
      name: 'Project 2',
    };

    test('updates known project', () => {
      const changedProject = {
        ...project,
        name: 'Changed Project',
      };
      const expected = {
        projects: [changedProject, project2],
      };
      const actual = reducer(
        { projects: [project, project2] },
        { type: 'PROJECT_UPDATE', payload: changedProject },
      );

      expect(actual).toEqual(expected);
    });

    test('adds unknown project', () => {
      const project3 = {
        id: 'r3',
        slug: 'project-3',
        name: 'Project 3',
      };
      const expected = {
        projects: [project, project2, project3],
      };
      const actual = reducer(
        { projects: [project, project2] },
        { type: 'PROJECT_UPDATE', payload: project3 },
      );

      expect(actual).toEqual(expected);
    });
  });
});
