import i18n from 'i18next';
import { pick } from 'lodash';
import React from 'react';
import { Trans } from 'react-i18next';
import { Step } from 'react-joyride';

import GuidedTour, {
  getFinalStep,
  TourProps,
} from '@/js/components/tour/guided';
import { getDemoEpic } from '@/js/components/tour/plan';
import { Task } from '@/js/store/tasks/reducer';
import { DEFAULT_ORG_CONFIG_NAME, TASK_STATUSES } from '@/js/utils/constants';

export const getDemoTask = ({
  project,
  github_id,
}: {
  project: string;
  github_id: string | null;
}): Task => {
  const epic = getDemoEpic({ project, github_id });

  return {
    id: 'demo-task',
    name: i18n.t('This is a Sample Task'),
    description: '',
    description_rendered: '',
    epic: pick(epic, ['id', 'name', 'slug', 'github_users']),
    project: null,
    slug: 'this-is-a-sample-task',
    old_slugs: [],
    has_unmerged_commits: true,
    currently_creating_branch: false,
    currently_creating_pr: false,
    branch_name: '',
    root_project: project,
    branch_url: null,
    commits: [],
    origin_sha: '',
    branch_diff_url: null,
    pr_url: null,
    review_submitted_at: null,
    review_valid: false,
    review_status: '',
    review_sha: '',
    status: TASK_STATUSES.IN_PROGRESS,
    pr_is_open: false,
    assigned_dev: github_id,
    assigned_qa: null,
    currently_submitting_review: false,
    org_config_name: DEFAULT_ORG_CONFIG_NAME,
  };
};

const HelpTour = (props: TourProps) => {
  /*
    Note: Any step which targets an element that may be hidden (or not in the
    DOM) will be skipped unless the element is made visible when the *prior*
    step is active.
  */
  const steps: Step[] = [
    {
      target: '.tour-project-tasks-list',
      title: i18n.t('List of Tasks'),
      content: (
        <Trans i18nKey="walkthroughHelpListTasks">
          Select the Tasks tab to see a list of all the work being done on this
          Project and who is doing it. Tasks represent small changes to the
          Project, and may be part of an Epic.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.tour-task-tester-column',
      title: i18n.t('Task Testers'),
      content: (
        <Trans i18nKey="walkthroughHelpTaskTester">
          Assign yourself or someone else as a Tester to help on a Task for this
          Project. When a Task has a status of <b>Test</b>, it is ready for
          testing. Testers create a Test Org to view the Developer’s work, and
          approve the work or request changes before the Task can be completed.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.tour-task-status-column',
      title: i18n.t('Task statuses'),
      content: (
        <Trans i18nKey="walkthroughHelpTaskStatus">
          A Task begins with a status of <b>Planned</b>. When a Dev Org is
          created, the status changes to <b>In Progress</b>, and the Developer
          begins work. When the Developer is ready for the work to be tested,
          the status becomes <b>Test</b>. After Testing, the status becomes
          either <b>Changes Requested</b> or <b>Approved</b> based on the
          Tester’s review. If the Developer retrieves new changes, the status
          moves back to <b>In Progress</b>. Once the Task is added to the
          Project on GitHub, the status is <b>Complete</b>.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    getFinalStep(),
  ];

  return <GuidedTour steps={steps} {...props} />;
};

export default HelpTour;
