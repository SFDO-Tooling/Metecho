import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Step } from 'react-joyride';

const steps: Step[] = [
  {
    target: '.tour-create-epic',
    title: i18n.t('Create Epics to group Tasks'),
    content: (
      <Trans i18nKey="tourCreateEpic">
        Epics are groups of related Tasks, representing larger changes to the
        Project. You can invite multiple Collaborators to your Epic and assign
        different people as Developers and Testers for each Task.
      </Trans>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.tour-walkthroughs',
    title: i18n.t('Review walkthroughs any time'),
    content: (
      <Trans i18nKey="tourWalkthroughs">
        If you would like to review this or any other walkthrough again, simply
        click the question mark. There is also a self-guided tour with more
        object and action explanations.
      </Trans>
    ),
    placement: 'right',
    disableBeacon: true,
  },
];

export default steps;
