import { render } from '@testing-library/react';
import React from 'react';

import TaskStatusSteps from '@/components/tasks/steps';
import { REVIEW_STATUSES, TASK_STATUSES } from '@/utils/constants';

const defaultTask = {
  id: 'task',
  review_valid: false,
  review_status: null,
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
  has_unsaved_changes: false,
};
const defaultReviewOrg = {
  id: 'review-org',
  task: 'task',
  org_type: 'QA',
  owner: 'stacy',
  owner_gh_username: 'stacy',
  url: '/bar/',
  has_been_visited: false,
};
const reviewOrgVisited = {
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
const taskWithReviewer = {
  ...taskWithPR,
  assigned_qa: stacy,
};
const taskWithReviewRejected = {
  ...taskWithReviewer,
  review_valid: true,
  review_status: REVIEW_STATUSES.CHANGES_REQUESTED,
};
const taskWithReviewApproved = {
  ...taskWithReviewer,
  review_valid: true,
  review_status: REVIEW_STATUSES.APPROVED,
};
const taskWithReviewInvalid = {
  ...taskWithReviewer,
  review_valid: false,
  review_status: REVIEW_STATUSES.APPROVED,
};

describe('<TaskStatusSteps />', () => {
  test.each([
    ['planned, no orgs', {}, null, null],
    ['dev assigned, no orgs', { assigned_dev: jonny }, null, null],
    ['dev org', taskWithDev, {}, null],
    [
      'dev org with uncaptured changes',
      taskWithDev,
      { has_unsaved_changes: true },
      null,
    ],
    ['changes captured', taskWithChanges, {}, null],
    ['submitted for review', taskWithPR, {}, null],
    ['reviewer assigned, no org', taskWithReviewer, {}, null],
    ['review org', taskWithReviewer, {}, { latest_commit: 'foo' }],
    ['review org out-of-date', taskWithReviewer, {}, {}],
    ['review org visited', taskWithReviewer, {}, reviewOrgVisited],
    ['review rejected', taskWithReviewRejected, {}, reviewOrgVisited],
    ['review approved', taskWithReviewApproved, {}, reviewOrgVisited],
    ['review invalid', taskWithReviewInvalid, {}, reviewOrgVisited],
  ])('renders steps: %s', (name, taskOpts, devOrgOpts, reviewOrgOpts) => {
    const task = { ...defaultTask, ...taskOpts };
    let devOrg, reviewOrg;
    if (devOrgOpts === null) {
      devOrg = null;
    } else {
      devOrg = { ...defaultDevOrg, ...devOrgOpts };
    }
    if (reviewOrgOpts === null) {
      reviewOrg = null;
    } else {
      reviewOrg = { ...defaultReviewOrg, ...reviewOrgOpts };
    }
    const orgs = {
      Dev: devOrg,
      QA: reviewOrg,
    };
    const { container } = render(<TaskStatusSteps task={task} orgs={orgs} />);

    expect(container).toMatchSnapshot();
  });
});
