import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import RepositoryListItem from '@/components/repositories/listItem';

describe('<RepositoryListItem />', () => {
  const setup = (initialState) => {
    const { getByText } = render(
      <MemoryRouter>
        <>
          {initialState.repositories.repositories.map((repository) => (
            <RepositoryListItem repository={repository} key={repository.id} />
          ))}
        </>
      </MemoryRouter>,
    );
    return { getByText };
  };

  test('renders repository', () => {
    const initialState = {
      repositories: {
        repositories: [
          {
            id: 'r1',
            name: 'Repository 1',
            slug: 'repository-1',
            description: 'This is a test repository.',
            repo_url: 'https://www.github.com/test/test-repo',
          },
          {
            id: 'p2',
            name: 'Repository 2',
            slug: 'repository-2',
            repo_url: 'https://www.github.com/test/another-test-repo',
          },
        ],
        notFound: [],
        next: null,
      },
    };
    const { getByText } = setup(initialState);

    expect(getByText('Repository 1')).toBeVisible();
    expect(getByText('This is a test repository.')).toBeVisible();
    expect(getByText('Repository 2')).toBeVisible();
  });
});
