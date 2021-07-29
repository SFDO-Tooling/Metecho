import React from 'react';

import EpicStatusSteps from '@/js/components/epics/steps';
import { EPIC_STATUSES, TASK_STATUSES } from '@/js/utils/constants';

import { render } from './../../utils';

const jonny = {
  id: 'jonny',
  login: 'jonny',
  permissions: { push: true },
};
const stacy = {
  id: 'stacy',
  login: 'stacy',
  permissions: { push: true },
};
const defaultEpic = {
  id: 'epic1',
  slug: 'epic-1',
  name: 'Epic 1',
  project: 'p1',
  branch_url: 'https://github.com/test/test-repo/tree/branch-name',
  branch_name: 'branch-name',
  github_users: [jonny.id, stacy.id],
  has_unmerged_commits: false,
  status: EPIC_STATUSES.PLANNED,
};
const epicWithTasks = {
  status: EPIC_STATUSES.IN_PROGRESS,
};
const epicWithChanges = {
  ...epicWithTasks,
  has_unmerged_commits: true,
};
const epicWithPR = {
  ...epicWithChanges,
  pr_is_open: true,
  pr_url: 'https://github.com/test/test-repo/pulls/123',
  status: EPIC_STATUSES.REVIEW,
};
const mergedEpic = {
  ...epicWithChanges,
  status: EPIC_STATUSES.MERGED,
};
const defaultTask = {
  id: 'task',
  epic: 'epic1',
  review_valid: false,
  review_status: '',
  pr_is_open: false,
  status: TASK_STATUSES.PLANNED,
  assigned_dev: null,
  assigned_qa: null,
  has_unmerged_commits: false,
  commits: [],
  origin_sha: 'parent_sha',
};
const taskWithDev = {
  assigned_dev: jonny.id,
  status: TASK_STATUSES.IN_PROGRESS,
};

describe('<EpicStatusSteps />', () => {
  test.each([
    ['planned, no tasks', {}, null],
    ['task created, no assigned dev', epicWithTasks, {}],
    ['dev assigned', epicWithTasks, taskWithDev],
    ['epic with commits', epicWithChanges, taskWithDev, true],
    ['epic with pr', epicWithPR, taskWithDev],
    ['merged epic', mergedEpic, taskWithDev],
  ])('renders steps: %s', (name, epicOpts, taskOpts, readyToSubmit = false) => {
    const epic = { ...defaultEpic, ...epicOpts };
    let tasks = [{ ...defaultTask, ...taskOpts }];
    if (taskOpts === null) {
      tasks = [];
    }
    const { container } = render(
      <EpicStatusSteps
        epic={epic}
        tasks={tasks}
        readyToSubmit={readyToSubmit}
        canSubmit
        handleAction={jest.fn()}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
