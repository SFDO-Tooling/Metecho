import React from 'react';

import CommitList from '~js/components/commits/list';

import { renderWithRedux } from './../../utils';

describe('<CommitList/>', () => {
  test('renders a table of commits', () => {
    const commits = [
      {
        id: 'abc123def456',
        timestamp: '2019-12-09 12:24',
        message: 'This is a commit',
        author: {
          name: 'Author',
          email: 'author@example.com',
          username: 'author123',
          avatar_url: 'https://example.com/avatar.png',
        },
        url: 'https://example.com/commit/abc123def456',
      },
    ];
    const { getByText, getAllByTitle } = renderWithRedux(
      <CommitList commits={commits} />,
    );

    expect(getByText('abc123d')).toBeVisible();
    expect(getByText('This is a commit')).toBeVisible();
    expect(getAllByTitle('author123 (Author)')).toHaveLength(2);
  });

  test('combines author username/name if identical', () => {
    const commits = [
      {
        id: 'abc123def456',
        timestamp: '2019-12-09 12:24',
        message: 'This is a commit',
        author: {
          name: 'author123',
          email: 'author@example.com',
          username: 'author123',
        },
        url: 'https://example.com/commit/abc123def456',
      },
    ];
    const { getByTitle } = renderWithRedux(<CommitList commits={commits} />);

    expect(getByTitle('author123')).toBeVisible();
  });

  test('does not render if list is empty', () => {
    const { container } = renderWithRedux(<CommitList commits={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
