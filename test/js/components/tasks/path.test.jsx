import React from 'react';

import TaskStatusPath from '@/js/components/tasks/path';
import { REVIEW_STATUSES, TASK_STATUSES } from '@/js/utils/constants';

import { render } from './../../utils';

const defaultTask = {
  id: 'task',
  review_valid: false,
  review_status: '',
  pr_is_open: false,
  status: TASK_STATUSES.PLANNED,
};

describe('<TaskStatusPath />', () => {
  test.each([
    ['planned', {}],
    ['in progress', { status: TASK_STATUSES.IN_PROGRESS }],
    ['review', { status: TASK_STATUSES.IN_PROGRESS, pr_is_open: true }],
    [
      'changes requested',
      {
        status: TASK_STATUSES.IN_PROGRESS,
        pr_is_open: true,
        review_valid: true,
        review_status: REVIEW_STATUSES.CHANGES_REQUESTED,
      },
    ],
    [
      'approved',
      {
        status: TASK_STATUSES.IN_PROGRESS,
        pr_is_open: true,
        review_valid: true,
        review_status: REVIEW_STATUSES.APPROVED,
      },
    ],
    [
      'merged',
      {
        status: TASK_STATUSES.COMPLETED,
        pr_is_open: false,
        review_valid: true,
        review_status: REVIEW_STATUSES.APPROVED,
      },
    ],
  ])('renders steps from task status: %s', (name, opts) => {
    const task = { ...defaultTask, ...opts };
    const { container } = render(<TaskStatusPath task={task} />);

    expect(container).toMatchSnapshot();
  });
});
