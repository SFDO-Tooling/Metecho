import { render } from '@testing-library/react';
import React from 'react';

import CommitList from '@/components/commits/list';

describe('<CommitList/>', () => {
  test('renders a table of commits', () => {
    const task = {
      branch_url: 'https://github.com/example/repo',
    };
    const commits = [
      {
        sha: 'abc123def456',
        timestamp: '2019-12-09 12:24',
        author: {
          avatar_url: 'https://example.com/avatar.png',
        },
        message: 'This is a commit',
      },
    ];
    const { getByText } = render(<CommitList task={task} commits={commits} />);
    expect(getByText('This is a commit')).toBeVisible();
  });
});
