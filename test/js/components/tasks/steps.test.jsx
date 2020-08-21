import { render } from '@testing-library/react';
import React from 'react';

import TaskStatusSteps from '@/components/tasks/steps';
import { REVIEW_STATUSES, TASK_STATUSES } from '@/utils/constants';

const defaultTask = {
  id: 'task',
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
const defaultDevOrg = {
  id: 'dev-org',
  task: 'task',
  org_type: 'Dev',
  owner: 'jonny',
  owner_gh_username: 'jonny',
  url: '/foo/',
  is_created: true,
  has_unsaved_changes: false,
};
const defaultTestOrg = {
  id: 'review-org',
  task: 'task',
  org_type: 'QA',
  owner: 'stacy',
  owner_gh_username: 'stacy',
  url: '/bar/',
  is_created: true,
  has_been_visited: false,
};
const testOrgVisited = {
  has_been_visited: true,
  latest_commit: 'foo',
};
const jonny = {
  id: 'jonny',
  login: 'jonny',
};
const stacy = {
  id: 'stacy',
  login: 'stacy',
};
const taskWithDev = {
  assigned_dev: jonny,
  status: TASK_STATUSES.IN_PROGRESS,
};
const taskWithChanges = {
  ...taskWithDev,
  has_unmerged_commits: true,
  commits: [{ id: 'foo' }],
};
const taskWithPR = {
  ...taskWithChanges,
  pr_is_open: true,
};
const taskWithTester = {
  ...taskWithPR,
  assigned_qa: stacy,
};
const taskSubmittingReview = {
  ...taskWithTester,
  currently_submitting_review: true,
};
const taskWithReviewRejected = {
  ...taskWithTester,
  review_valid: true,
  review_status: REVIEW_STATUSES.CHANGES_REQUESTED,
};
const taskWithReviewApproved = {
  ...taskWithTester,
  review_valid: true,
  review_status: REVIEW_STATUSES.APPROVED,
};
const taskWithReviewInvalid = {
  ...taskWithTester,
  review_valid: false,
  review_status: REVIEW_STATUSES.APPROVED,
};

describe('<TaskStatusSteps />', () => {
  test.each([
    ['planned, no orgs', {}, null, null],
    ['dev assigned, no orgs', { assigned_dev: jonny }, null, null],
    ['dev org creating', taskWithDev, { is_created: false }, null],
    ['dev org', taskWithDev, {}, null],
    [
      'dev org checking for changes',
      taskWithDev,
      { currently_refreshing_changes: true },
      null,
    ],
    [
      'dev org with unretrieved changes',
      taskWithDev,
      { has_unsaved_changes: true },
      null,
    ],
    ['changes retrieved', taskWithChanges, {}, null],
    ['submitted for testing', taskWithPR, {}, null],
    ['tester assigned, no org', taskWithTester, {}, null],
    ['test org creating', taskWithTester, {}, { is_created: false }],
    ['test org', taskWithTester, {}, { latest_commit: 'foo' }],
    ['test org out-of-date', taskWithTester, {}, {}],
    [
      'test org refreshing',
      taskWithTester,
      {},
      { currently_refreshing_org: true },
    ],
    ['test org visited', taskWithTester, {}, testOrgVisited],
    ['submitting review', taskSubmittingReview, {}, testOrgVisited],
    ['review rejected', taskWithReviewRejected, {}, testOrgVisited],
    ['review approved', taskWithReviewApproved, {}, testOrgVisited],
    ['review invalid', taskWithReviewInvalid, {}, testOrgVisited],
  ])('renders steps: %s', (name, taskOpts, devOrgOpts, testOrgOpts) => {
    const task = { ...defaultTask, ...taskOpts };
    let devOrg, testOrg;
    if (devOrgOpts === null) {
      devOrg = null;
    } else {
      devOrg = { ...defaultDevOrg, ...devOrgOpts };
    }
    if (testOrgOpts === null) {
      testOrg = null;
    } else {
      testOrg = { ...defaultTestOrg, ...testOrgOpts };
    }
    const orgs = {
      Dev: devOrg,
      QA: testOrg,
    };
    const { container } = render(
      <TaskStatusSteps task={task} orgs={orgs} user={jonny} />,
    );

    expect(container).toMatchSnapshot();
  });
});
