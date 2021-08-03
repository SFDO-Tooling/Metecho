import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import ProjectListItem from '@/js/components/projects/listItem';

import { render } from './../../utils';

describe('<ProjectListItem />', () => {
  const setup = (initialState) => {
    const { getByText } = render(
      <MemoryRouter>
        {initialState.projects.projects.map((project) => (
          <ProjectListItem project={project} key={project.id} />
        ))}
      </MemoryRouter>,
    );
    return { getByText };
  };

  test('renders project', () => {
    const initialState = {
      projects: {
        projects: [
          {
            id: 'r1',
            name: 'Project 1',
            slug: 'project-1',
            description: 'This is a test project.',
            description_rendered: '<p>This is a test project.</p>',
            repo_url: 'https://github.com/test/test-repo',
            repo_image_url: '',
          },
          {
            id: 'p2',
            name: 'Project 2',
            slug: 'project-2',
            description: '',
            description_rendered: '',
            repo_url: 'https://github.com/test/another-test-repo',
            repo_image_url: 'https://github.com/repo-image',
          },
        ],
        notFound: [],
        next: null,
      },
    };
    const { getByText } = setup(initialState);

    expect(getByText('Project 1')).toBeVisible();
    expect(getByText('This is a test project.')).toBeVisible();
    expect(getByText('Project 2')).toBeVisible();
  });
});
