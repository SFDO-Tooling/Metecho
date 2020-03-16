import { render } from '@testing-library/react';
import React from 'react';

import ProjectStatusPath from '@/components/projects/path';
import { PROJECT_STATUSES } from '@/utils/constants';

const defaultProject = {
  status: PROJECT_STATUSES.PLANNED,
};

describe('<ProjectStatusPath />', () => {
  test.each([
    ['planned', {}],
    ['in progress', { status: PROJECT_STATUSES.IN_PROGRESS }],
    ['all tasks complete', { status: PROJECT_STATUSES.REVIEW }],
    ['pr opened', { status: PROJECT_STATUSES.REVIEW, pr_is_open: true }],
    ['merged', { status: PROJECT_STATUSES.MERGED }],
  ])('renders steps from project status: %s', (name, opts) => {
    const project = { ...defaultProject, ...opts };
    const { container } = render(
      <ProjectStatusPath
        status={project.status}
        prIsOpen={project.pr_is_open}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
