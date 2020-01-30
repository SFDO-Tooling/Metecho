import reducer from '@/store/projects/reducer';

describe('reducer', () => {
  test('returns initial state if no action', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test.each([['USER_LOGGED_OUT'], ['REFETCH_DATA_SUCCEEDED']])(
    'returns initial state on %s action',
    (action) => {
      const project1 = {
        id: 'r1',
        slug: 'project-1',
        name: 'Project 1',
        description: 'This is a test project.',
        repository: 'repository-1',
      };
      const expected = {};
      const actual = reducer(
        {
          'repository-1': {
            projects: [project1],
            next: 'next-url',
            notFound: ['project-2'],
          },
        },
        { type: action },
      );

      expect(actual).toEqual(expected);
    },
  );

  describe('FETCH_OBJECTS_SUCCEEDED', () => {
    test('resets projects list for repository if `reset: true`', () => {
      const project1 = {
        id: 'r1',
        slug: 'project-1',
        name: 'Project 1',
        description: 'This is a test project.',
        repository: 'repository-1',
      };
      const project2 = {
        id: 'p2',
        slug: 'project-2',
        name: 'Project 2',
        description: 'This is another test project.',
        repository: 'repository-1',
      };
      const expected = {
        'repository-1': {
          projects: [project2],
          next: 'next-url',
          notFound: [],
          fetched: true,
        },
        'repository-2': {
          projects: [],
          next: null,
          notFound: [],
          fetched: false,
        },
      };
      const actual = reducer(
        {
          'repository-1': {
            projects: [project1],
            next: null,
            notFound: [],
            fetched: false,
          },
          'repository-2': {
            projects: [],
            next: null,
            notFound: [],
            fetched: false,
          },
        },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [project2], next: 'next-url' },
            objectType: 'project',
            reset: true,
            filters: { repository: 'repository-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('creates repository-project data if not already known', () => {
      const project1 = {
        id: 'r1',
        slug: 'project-1',
        name: 'Project 1',
        description: 'This is a test project.',
        repository: 'repository-1',
      };
      const expected = {
        'repository-1': {
          projects: [project1],
          next: 'next-url',
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [project1], next: 'next-url' },
            objectType: 'project',
            reset: true,
            filters: { repository: 'repository-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('adds to projects list if `reset: false`', () => {
      const project1 = {
        id: 'project1',
        slug: 'project-1',
        name: 'Project 1',
        repository: 'repository-1',
      };
      const mockProjects = {
        notFound: [],
        projects: [project1],
        next: null,
        fetched: false,
      };
      const project2 = {
        id: 'project2',
        slug: 'project-2',
        name: 'Project 2',
        repository: 'repository-1',
      };
      const expected = {
        'repository-1': {
          ...mockProjects,
          projects: [...mockProjects.projects, project2],
          fetched: true,
        },
      };
      const actual = reducer(
        { 'repository-1': mockProjects },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [project1, project2], next: null },
            objectType: 'project',
            reset: false,
            filters: { repository: 'repository-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "project"', () => {
      const project = {
        id: 'r1',
        slug: 'project-1',
        name: 'Project 1',
        repository: 'repository-1',
      };
      const expected = {};
      const actual = reducer(expected, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: { results: [project], next: null },
          objectType: 'other-object',
          reset: true,
          filters: { repository: 'repository-1' },
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('CREATE_OBJECT_SUCCEEDED', () => {
    test('adds project to list', () => {
      const project1 = {
        id: 'r1',
        slug: 'project-1',
        name: 'Project 1',
        description: 'This is a test project.',
        repository: 'repository-1',
      };
      const expected = {
        'repository-1': {
          projects: [project1],
          next: null,
          notFound: [],
          fetched: false,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: project1,
            objectType: 'project',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('does not add duplicate project', () => {
      const project1 = {
        id: 'r1',
        slug: 'project-1',
        name: 'Project 1',
        description: 'This is a test project.',
        repository: 'repository-1',
      };
      const expected = {
        'repository-1': { projects: [project1], next: null, notFound: [] },
      };
      const actual = reducer(
        {
          'repository-1': { projects: [project1], next: null, notFound: [] },
        },
        {
          type: 'CREATE_OBJECT_SUCCEEDED',
          payload: {
            object: project1,
            objectType: 'project',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "project"', () => {
      const project = {
        id: 'r1',
        slug: 'project-1',
        name: 'Project 1',
        repository: 'repository-1',
      };
      const expected = {};
      const actual = reducer(expected, {
        type: 'CREATE_OBJECT_SUCCEEDED',
        payload: {
          object: project,
          objectType: 'other-object',
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('FETCH_OBJECT_SUCCEEDED', () => {
    test('adds project', () => {
      const project1 = {
        id: 'r1',
        slug: 'project-1',
        name: 'Project 1',
        repository: 'repository1',
      };
      const project2 = {
        id: 'p2',
        slug: 'project-2',
        name: 'Project 2',
        repository: 'repository1',
      };
      const expected = {
        repository1: {
          projects: [project1, project2],
          next: null,
          notFound: [],
        },
      };
      const actual = reducer(
        {
          repository1: { projects: [project1], next: null, notFound: [] },
        },
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: project2,
            filters: { repository: 'repository1', slug: 'project-2' },
            objectType: 'project',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores id of missing project', () => {
      const expected = {
        repository1: {
          projects: [],
          next: null,
          notFound: ['project-2'],
          fetched: false,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            object: null,
            filters: { repository: 'repository1', slug: 'project-2' },
            objectType: 'project',
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores duplicate project', () => {
      const project1 = {
        id: 'r1',
        slug: 'project-1',
        name: 'Project 1',
        repository: 'repository1',
      };
      const expected = {
        repository1: { projects: [project1], next: null, notFound: [] },
      };
      const actual = reducer(expected, {
        type: 'FETCH_OBJECT_SUCCEEDED',
        payload: {
          object: project1,
          filters: { repository: 'repository1', slug: 'project-1' },
          objectType: 'project',
        },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "project"', () => {
      const expected = {};
      const actual = reducer(
        {},
        {
          type: 'FETCH_OBJECT_SUCCEEDED',
          payload: {
            objectType: 'repository',
            filters: {},
          },
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('PROJECT_UPDATE', () => {
    test('adds new project to list', () => {
      const project = {
        id: 'p1',
        repository: 'repository-1',
        name: 'Project 1',
      };
      const expected = {
        'repository-1': {
          projects: [project],
          next: null,
          notFound: [],
          fetched: false,
        },
      };
      const actual = reducer(
        {},
        {
          type: 'PROJECT_UPDATE',
          payload: project,
        },
      );

      expect(actual).toEqual(expected);
    });

    test('updates existing project', () => {
      const project = {
        id: 'p1',
        repository: 'repository-1',
        name: 'Project 1',
      };
      const project2 = {
        id: 'p2',
        repository: 'repository-1',
        name: 'Project 2',
      };
      const editedProject = { ...project, name: 'Edited Project Name' };
      const expected = {
        'repository-1': {
          projects: [editedProject, project2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {
          'repository-1': {
            projects: [project, project2],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
        {
          type: 'PROJECT_UPDATE',
          payload: editedProject,
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('UPDATE_OBJECT_SUCCEEDED', () => {
    test('updates existing project', () => {
      const project = {
        id: 'p1',
        repository: 'repository-1',
        name: 'Project 1',
      };
      const project2 = {
        id: 'p2',
        repository: 'repository-1',
        name: 'Project 2',
      };
      const editedProject = { ...project, name: 'Edited Project Name' };
      const expected = {
        'repository-1': {
          projects: [editedProject, project2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {
          'repository-1': {
            projects: [project, project2],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
        {
          type: 'UPDATE_OBJECT_SUCCEEDED',
          payload: {
            objectType: 'project',
            object: editedProject,
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if unknown objectType', () => {
      const project = {
        id: 'p1',
        repository: 'repository-1',
        name: 'Project 1',
      };
      const project2 = {
        id: 'p2',
        repository: 'repository-1',
        name: 'Project 2',
      };
      const editedProject = { ...project, name: 'Edited Project Name' };
      const expected = {
        'repository-1': {
          projects: [project, project2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {
          'repository-1': {
            projects: [project, project2],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
        {
          type: 'UPDATE_OBJECT_SUCCEEDED',
          payload: {
            objectType: 'foobar',
            object: editedProject,
          },
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('PROJECT_CREATE_PR_FAILED', () => {
    test('sets currently_creating_pr: false', () => {
      const project = {
        id: 'p1',
        repository: 'repository-1',
        name: 'Project 1',
        currently_creating_pr: true,
      };
      const project2 = {
        id: 'p2',
        repository: 'repository-1',
        name: 'Project 2',
      };
      const editedProject = { ...project, currently_creating_pr: false };
      const expected = {
        'repository-1': {
          projects: [editedProject, project2],
          next: null,
          notFound: [],
          fetched: true,
        },
      };
      const actual = reducer(
        {
          'repository-1': {
            projects: [project, project2],
            next: null,
            notFound: [],
            fetched: true,
          },
        },
        {
          type: 'PROJECT_CREATE_PR_FAILED',
          payload: project,
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if no existing project', () => {
      const project = {
        id: 'p1',
        repository: 'repository-1',
        name: 'Project 1',
        currently_creating_pr: true,
      };
      const actual = reducer(
        {},
        {
          type: 'PROJECT_CREATE_PR_FAILED',
          payload: project,
        },
      );

      expect(actual).toEqual({});
    });
  });
});
