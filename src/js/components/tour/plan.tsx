import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Step } from 'react-joyride';

import GuidedTour, {
  getFinalStep,
  TourProps,
} from '@/js/components/tour/guided';
import { Epic } from '@/js/store/epics/reducer';
import { EPIC_STATUSES } from '@/js/utils/constants';

export const getDemoEpic = ({
  project,
  github_id,
}: {
  project: string;
  github_id: string | null;
}): Epic => {
  const description = i18n.t(
    'This is a sample description to show where the description of the Epic would appear.',
  );

  return {
    id: 'demo-epic',
    name: i18n.t('This is a Sample Epic'),
    description,
    description_rendered: `<p>${description}</p>`,
    slug: 'this-is-a-sample-epic',
    old_slugs: [],
    project,
    task_count: 1,
    branch_url: '#',
    branch_diff_url: null,
    branch_name: 'feature/this-is-a-sample-epic',
    has_unmerged_commits: false,
    currently_creating_branch: false,
    currently_creating_pr: false,
    pr_url: null,
    pr_is_open: false,
    pr_is_merged: false,
    status: EPIC_STATUSES.IN_PROGRESS,
    github_users: /* istanbul ignore next */ github_id ? [github_id] : [],
    latest_sha: '',
  };
};

const PlanTour = (props: TourProps) => {
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
        <Trans i18nKey="walkthroughPlanListTasks">
          Select the Tasks tab to see a list of all the work being done on this
          Project and who is doing it. Tasks represent small changes to the
          Project, and may be part of an Epic.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.tour-create-task',
      title: i18n.t('Create a Task to contribute'),
      content: (
        <Trans i18nKey="walkthroughPlanCreateTask">
          To get started contributing to this Project, create a Task. Tasks
          represent small changes to this Project; each one has a Developer and
          a Tester. Tasks are equivalent to GitHub branches.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.tour-project-epics-list',
      title: i18n.t('List of Epics'),
      content: (
        <Trans i18nKey="walkthroughPlanListEpics">
          Select the Epics tab to see a list of all the Epics for this Project.
          Each Epic is a group of related Tasks.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.tour-create-epic',
      title: i18n.t('Create Epics to group Tasks'),
      content: (
        <Trans i18nKey="walkthroughPlanCreateEpic">
          Epics represent larger changes to the Project. You can invite multiple
          Collaborators to your Epic and assign different people as Developers
          and Testers for each Task.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    getFinalStep(),
  ];

  return <GuidedTour steps={steps} {...props} />;
};

export default PlanTour;
