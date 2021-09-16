import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Step } from 'react-joyride';

import GuidedTour, {
  getFinalStep,
  TourProps,
} from '@/js/components/tour/guided';

const PlayTour = (props: TourProps) => {
  const steps: Step[] = [
    {
      target: '.walkthrough-metecho-name',
      title: i18n.t('What’s in a name?'),
      content: (
        <Trans i18nKey="walkthroughPlayMetechoName">
          Metecho makes it easier for you to view, test, and contribute to
          Salesforce Projects without learning GitHub.
          <br />
          <br />
          <b>Pronunciation</b>: “Met” rhymes with “Bet.” “Echo” as in the
          reflection of sound waves.
          <br />
          <b>Definition</b>: “Share or participate in.”
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.tour-scratch-org',
      title: i18n.t('View & play with a Project'),
      content: (
        <Trans i18nKey="walkthroughPlayScratchOrg">
          Scratch Orgs are a temporary place for you to view the work on this
          Project. You can use Scratch Orgs to play with changes to the Project
          without affecting the Project.
        </Trans>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: '.tour-project-tasks-list',
      title: i18n.t('List of Tasks'),
      content: (
        <Trans i18nKey="walkthroughPlayListTasks">
          Select the Tasks tab to see a list of all the work being done on this
          Project and who is doing it. Tasks represent small changes to the
          Project and may be grouped with other Tasks in an Epic. Select a Task
          and create a Task Scratch Org to view the work on that Task.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.tour-project-epics-list',
      title: i18n.t('List of Epics'),
      content: (
        <Trans i18nKey="walkthroughPlayListEpics">
          Select the Epics tab to see a list of all the Epics for this Project.
          Each Epic is a group of related Tasks. Select an Epic and create an
          Epic Scratch Org to view the work on that Epic.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    getFinalStep(),
  ];

  return <GuidedTour steps={steps} {...props} />;
};

export default PlayTour;
