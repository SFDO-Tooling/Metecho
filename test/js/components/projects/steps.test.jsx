import { render } from '@testing-library/react';
import React from 'react';

import ProjectStatusSteps from '@/components/projects/steps';
import { PROJECT_STATUSES, TASK_STATUSES } from '@/utils/constants';

const jonny = {
  id: 'jonny',
  login: 'jonny',
};
const stacy = {
  id: 'stacy',
  login: 'stacy',
};
const defaultProject = {
  id: 'project1',
  slug: 'project-1',
  name: 'Project 1',
  repository: 'r1',
  branch_url: 'https://github.com/test/test-repo/tree/branch-name',
  branch_name: 'branch-name',
  github_users: [jonny, stacy],
  available_task_org_config_names: [],
  has_unmerged_commits: false,
  status: PROJECT_STATUSES.PLANNED,
};
const projectWithTasks = {
  status: PROJECT_STATUSES.IN_PROGRESS,
};
const projectWithChanges = {
  ...projectWithTasks,
  has_unmerged_commits: true,
};
const projectWithPR = {
  ...projectWithChanges,
  pr_is_open: true,
  pr_url: 'https://github.com/test/test-repo/pulls/123',
  status: PROJECT_STATUSES.REVIEW,
};
const mergedProject = {
  ...projectWithChanges,
  status: PROJECT_STATUSES.MERGED,
};
const defaultTask = {
  id: 'task',
  project: 'project1',
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
  assigned_dev: jonny,
  status: TASK_STATUSES.IN_PROGRESS,
};

describe('<ProjectStatusSteps />', () => {
  test.each([
    ['planned, no tasks', {}, null],
    ['task created, no assigned dev', projectWithTasks, {}],
    ['dev assigned', projectWithTasks, taskWithDev],
    ['project with commits', projectWithChanges, taskWithDev, true],
    ['project with pr', projectWithPR, taskWithDev],
    ['merged project', mergedProject, taskWithDev],
  ])(
    'renders steps: %s',
    (name, projectOpts, taskOpts, readyToSubmit = false) => {
      const project = { ...defaultProject, ...projectOpts };
      let tasks = [{ ...defaultTask, ...taskOpts }];
      if (taskOpts === null) {
        tasks = [];
      }
      const { container } = render(
        <ProjectStatusSteps
          project={project}
          tasks={tasks}
          readyToSubmit={readyToSubmit}
          handleAction={jest.fn()}
        />,
      );

      expect(container).toMatchSnapshot();
    },
  );
});
