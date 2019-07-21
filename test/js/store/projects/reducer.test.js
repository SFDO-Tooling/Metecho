import reducer from '@/store/projects/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const project1 = {
      id: 'p1',
      slug: 'project-1',
      name: 'Project 1',
      description: 'This is a test project.',
      product: 'product-1',
    };
    const expected = {};
    const actual = reducer(
      {
        'product-1': {
          projects: [project1],
          next: 'next-url',
          notFound: ['project-2'],
        },
      },
      { type: 'USER_LOGGED_OUT' },
    );

    expect(actual).toEqual(expected);
  });

  describe('FETCH_OBJECTS_SUCCEEDED', () => {
    test('resets projects list for product if `reset: true`', () => {
      const project1 = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
        description: 'This is a test project.',
        product: 'product-1',
      };
      const project2 = {
        id: 'p2',
        slug: 'project-2',
        name: 'Project 2',
        description: 'This is another test project.',
        product: 'product-1',
      };
      const expected = {
        'product-1': { projects: [project2], next: 'next-url', notFound: [] },
        'product-2': { projects: [], next: null, notFound: [] },
      };
      const actual = reducer(
        {
          'product-1': { projects: [project1], next: null, notFound: [] },
          'product-2': { projects: [], next: null, notFound: [] },
        },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [project2], next: 'next-url' },
            objectType: 'project',
            reset: true,
            filters: { product: 'product-1' },
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
        product: 'product-1',
      };
      const mockProjects = {
        notFound: [],
        projects: [project1],
        next: null,
      };
      const project2 = {
        id: 'project2',
        slug: 'project-2',
        name: 'Project 2',
        product: 'product-1',
      };
      const expected = {
        'product-1': {
          ...mockProjects,
          projects: [...mockProjects.projects, project2],
        },
      };
      const actual = reducer(
        { 'product-1': mockProjects },
        {
          type: 'FETCH_OBJECTS_SUCCEEDED',
          payload: {
            response: { results: [project1, project2], next: null },
            objectType: 'project',
            reset: false,
            filters: { product: 'product-1' },
          },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('ignores if objectType !== "project"', () => {
      const project = {
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
        product: 'product-1',
      };
      const expected = {};
      const actual = reducer(expected, {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response: { results: [project], next: null },
          objectType: 'other-object',
          reset: true,
          filters: { product: 'product-1' },
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
        description: 'This is a test project.',
        product: 'product-1',
      };
      const expected = {
        'product-1': {
          projects: [project1],
          next: null,
          notFound: [],
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
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
        description: 'This is a test project.',
        product: 'product-1',
      };
      const expected = {
        'product-1': { projects: [project1], next: null, notFound: [] },
      };
      const actual = reducer(
        {
          'product-1': { projects: [project1], next: null, notFound: [] },
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
        id: 'p1',
        slug: 'project-1',
        name: 'Project 1',
        product: 'product-1',
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
});
