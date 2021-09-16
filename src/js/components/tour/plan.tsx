import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Step } from 'react-joyride';

import GuidedTour, {
  getFinalStep,
  TourProps,
} from '@/js/components/tour/guided';

const PlanTour = (props: TourProps) => {
  const steps: Step[] = [
    {
      target: '.tour-project-tasks-list',
      title: i18n.t('List of Tasks'),
      content: (
        <Trans i18nKey="walkthroughPlanListTasks">
          Select the Tasks tab to see a list of all the work being done on this
          Project and who is doing it. Tasks represent small changes to the
          Project and may be grouped with other Tasks in an Epic.
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
