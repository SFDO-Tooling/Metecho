import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Step } from 'react-joyride';

import GuidedTour, {
  getFinalStep,
  TourProps,
} from '@/js/components/tour/guided';

const HelpTour = (props: TourProps) => {
  const steps: Step[] = [
    {
      target: '.tour-project-tasks-list',
      title: i18n.t('List of Tasks'),
      content: (
        <Trans i18nKey="walkthroughTasksList">
          Select the Tasks tab to see a list of all the work being done on this
          Project and who is doing it. Tasks represent small changes to the
          Project and may be grouped with other Tasks in an Epic.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.tour-task-tester-column',
      title: i18n.t('Task Testers'),
      content: (
        <Trans i18nKey="walkthroughTaskTester">
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
        <Trans i18nKey="walkthroughTaskStatusColumn">
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
