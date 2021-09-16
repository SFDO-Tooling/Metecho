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
      target: '.tour-create-task',
      title: i18n.t('Create a Task to Contribute'),
      content: (
        <Trans i18nKey="walkthroughCreateTask">
          To get started contributing to this Project, create a Task. Tasks
          represent small changes to this Project; each one has a Developer and
          a Tester. Tasks are equivalent to GitHub branches.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.tour-create-epic',
      title: i18n.t('Create Epics to group Tasks'),
      content: (
        <Trans i18nKey="walkthroughCreateEpic">
          Epics are groups of related Tasks, representing larger changes to the
          Project. You can invite multiple Collaborators to your Epic and assign
          different people as Developers and Testers for each Task.
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
