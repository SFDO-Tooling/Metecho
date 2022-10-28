import * as i18n from 'i18next';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Step } from 'react-joyride';

import GuidedTour, {
  getFinalStep,
  TourProps,
} from '@/js/components/tour/guided';
import { Epic } from '@/js/store/epics/reducer';
import { GitHubUser } from '@/js/store/user/reducer';
import { EPIC_STATUSES } from '@/js/utils/constants';

export const getDemoEpic = ({
  project,
  githubUser,
}: {
  project: string;
  githubUser: GitHubUser | null;
}): Epic => {
  const description = i18n.t(
    'This is a sample description to show where the description of the Epic would appear.',
  );

  return {
    id: 'demo-epic',
    name: i18n.t('This is a Sample Epic'),
    created_at: '',
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
    github_users: /* istanbul ignore next */ githubUser ? [githubUser.id] : [],
    latest_sha: '',
    issue: null,
  };
};

const PlanTour = (props: TourProps) => {
  const { t } = useTranslation();

  /*
    Note: Any step which targets an element that may be hidden (or not in the
    DOM) will be skipped unless the element is made visible when the *prior*
    step is active.
  */
  const steps: Step[] = [
    {
      target: '.tour-project-tasks-list',
      title: t('List of Tasks'),
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
      title: t('Create a Task to contribute'),
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
      title: t('List of Epics'),
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
      title: t('Create Epics to group Tasks'),
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
    {
      target: '.tour-create-epic-from-issue',
      title: t('Create Epic from GitHub Issue'),
      content: (
        <Trans i18nKey="walkthroughPlanCreateEpicFromIssue">
          One way to start planning work for an Epic or a Task is to browse the
          list of GitHub Issues. Issues are items in GitHub’s bug and
          enhancement tracking system. Select an Issue to work on, and create an
          Epic or Task. Create an Epic for an Issue if it will require multiple
          Tasks to complete. If you’re unsure, begin with a Task and create an
          Epic later, as needed.
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
