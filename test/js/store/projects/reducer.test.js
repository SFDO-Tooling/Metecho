import reducer, { defaultState } from '@/js/store/projects/reducer';
import { OBJECT_TYPES } from '@/js/utils/constants';

describe('reducer', () => {
  test('returns initial state if no action', () => {
    const actual = reducer(undefined, {});

    expect(actual).toEqual(defaultState);
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
      const actual = reducer(
        {
          ...defaultState,
          projects: [project1],
          next: 'next-url',
          notFound: ['project-1'],
        },
        { type: action },
      );

      expect(actual).toEqual(defaultState);
    },
  );

  describe('REFRESH_PROJECTS_REQUESTED', () => {
    test('sets refreshing: true', () => {
      const expected = {
        ...defaultState,
        refreshing: true,
      };
      const actual = reducer(defaultState, {
        type: 'REFRESH_PROJECTS_REQUESTED',
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESHING_PROJECTS', () => {
    test('sets refreshing: true', () => {
      const expected = {
        ...defaultState,
        refreshing: true,
      };
      const actual = reducer(defaultState, { type: 'REFRESHING_PROJECTS' });

      expect(actual).toEqual(expected);
    });
  });

  describe('REFRESH_PROJECTS_REJECTED', () => {
    test('sets refreshing: false', () => {
      const actual = reducer(
        {
          ...defaultState,
          refreshing: true,
        },
        { type: 'REFRESH_PROJECTS_REJECTED' },
      );

      expect(actual).toEqual(defaultState);
    });
  });

  describe('PROJECT_DELETED', () => {
    test('removes project from list', () => {
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
        ...defaultState,
        projects: [project2],
      };
      const actual = reducer(
        { ...defaultState, projects: [project1, project2] },
        {
          type: 'PROJECT_DELETED',
          payload: project1.id,
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('FETCH_OBJECTS_STARTED', () => {
    test('sets fetchingDependencies: true', () => {
      const expected = {
        ...defaultState,
        fetchingDependencies: true,
      };
      const actual = reducer(defaultState, {
        type: 'FETCH_OBJECTS_STARTED',
        payload: { objectType: OBJECT_TYPES.PROJECT_DEPENDENCY },
      });

      expect(actual).toEqual(expected);
    });

    test('does not update fetchingDependencies for other object types', () => {
      const actual = reducer(defaultState, {
        type: 'FETCH_OBJECTS_STARTED',
        payload: { objectType: OBJECT_TYPES.PROJECT },
      });

      expect(actual).toEqual(defaultState);
    });
  });

  describe('FETCH_OBJECTS_SUCCEEDED', () => {
    describe('project', () => {
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
          ...defaultState,
          projects: [project2],
          next: 'next-url',
        };
        const actual = reducer(
          { ...defaultState, projects: [project1], refreshing: true },
          {
            type: 'FETCH_OBJECTS_SUCCEEDED',
            payload: {
              response: { results: [project2], next: 'next-url' },
              objectType: OBJECT_TYPES.PROJECT,
              reset: true,
            },
          },
        );

        expect(actual).toEqual(expected);
      });

      test('adds to projects list if `reset: false`', () => {
        const mockProjects = {
          ...defaultState,
          projects: [
            {
              id: 'project1',
              slug: 'project-1',
              name: 'Project 1',
            },
          ],
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
            objectType: OBJECT_TYPES.PROJECT,
            reset: false,
          },
        });

        expect(actual).toEqual(expected);
      });
    });

    describe('dependency', () => {
      test('resets dependencies list', () => {
        const dep = {
          id: 'd1',
          name: 'Dep 1',
          recommended: false,
        };
        const dep2 = {
          id: 'd2',
          name: 'Dep 2',
          recommended: true,
        };
        const expected = {
          ...defaultState,
          dependencies: [dep2],
          fetchingDependencies: false,
        };
        const actual = reducer(
          { ...defaultState, dependencies: [dep], fetchingDependencies: true },
          {
            type: 'FETCH_OBJECTS_SUCCEEDED',
            payload: {
              response: [dep2],
              objectType: OBJECT_TYPES.PROJECT_DEPENDENCY,
            },
          },
        );

        expect(actual).toEqual(expected);
      });
    });

    test('ignores if unknown objectType', () => {
      const project = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
      };
      const expected = {
        ...defaultState,
        projects: [project],
        next: 'next-url',
      };
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
      const expected = { ...defaultState, projects: [project1, project2] };
      const actual = reducer(
        { ...defaultState, projects: [project1] },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: project2,
            filters: { slug: 'project-2' },
            objectType: OBJECT_TYPES.PROJECT,
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
        ...defaultState,
        projects: [project1],
        notFound: ['project-2', 'project-3'],
      };
      const actual = reducer(
        { ...defaultState, projects: [project1], notFound: ['project-2'] },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: null,
            filters: { slug: 'project-3' },
            objectType: OBJECT_TYPES.PROJECT,
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
        ...defaultState,
        projects: [project1],
        notFound: ['project-2'],
      };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: project1,
          filters: { slug: 'project-1' },
          objectType: OBJECT_TYPES.PROJECT,
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
      const expected = { ...defaultState, projects: [project], next: null };
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

  describe('CREATE_OBJECT_SUCCEEDED', () => {
    test('adds project to list', () => {
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
      const expected = {
        ...defaultState,
        projects: [project1, project2],
      };
      const actual = reducer(
        { ...defaultState, projects: [project1] },
        {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: project2,
            objectType: OBJECT_TYPES.PROJECT,
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if project is already in list', () => {
      const project = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
      };
      const expected = {
        ...defaultState,
        projects: [project],
      };
      const actual = reducer(expected, {
        type: 'CREATE_OBJECT_SUCCEEDED',
        payload: {
          object: { ...project, name: 'Changed' },
          objectType: OBJECT_TYPES.PROJECT,
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
      const actual = reducer(defaultState, {
        type: 'CREATE_OBJECT_SUCCEEDED',
        payload: {
          object: project,
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(defaultState);
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
        ...defaultState,
        projects: [
          { ...project, currently_fetching_github_users: true },
          project2,
        ],
      };
      const actual = reducer(
        { ...defaultState, projects: [project, project2] },
        { type: 'REFRESH_GH_USERS_REQUESTED', payload: 'p1' },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if payload is not known project id', () => {
      const expected = { ...defaultState, projects: [project, project2] };
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
        ...defaultState,
        projects: [
          { ...project, currently_fetching_github_users: false },
          project2,
        ],
      };
      const actual = reducer(
        { ...defaultState, projects: [project, project2] },
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
        ...defaultState,
        projects: [
          { ...project, currently_fetching_org_config_names: true },
          project2,
        ],
      };
      const actual = reducer(
        { ...defaultState, projects: [project, project2] },
        { type: 'REFRESH_ORG_CONFIGS_REQUESTED', payload: 'p1' },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if payload is not known project id', () => {
      const expected = { ...defaultState, projects: [project, project2] };
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
        ...defaultState,
        projects: [
          { ...project, currently_fetching_org_config_names: false },
          project2,
        ],
      };
      const actual = reducer(
        { ...defaultState, projects: [project, project2] },
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
        ...defaultState,
        projects: [changedProject, project2],
      };
      const actual = reducer(
        { ...defaultState, projects: [project, project2] },
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
        ...defaultState,
        projects: [project, project2, project3],
      };
      const actual = reducer(
        { ...defaultState, projects: [project, project2] },
        { type: 'PROJECT_UPDATE', payload: project3 },
      );

      expect(actual).toEqual(expected);
    });
  });
});
