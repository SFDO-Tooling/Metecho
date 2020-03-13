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
    ['review', { status: PROJECT_STATUSES.REVIEW }],
    ['merged', { status: PROJECT_STATUSES.MERGED }],
  ])('renders steps from project status: %s', (name, opts) => {
    const project = { ...defaultProject, ...opts };
    const { container } = render(<ProjectStatusPath status={project.status} />);

    expect(container).toMatchSnapshot();
  });
});
