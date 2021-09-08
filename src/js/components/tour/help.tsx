import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Step } from 'react-joyride';

import GuidedTour, { getFinalStep } from '@/js/components/tour/guided';

interface Props {
  run: boolean;
  onClose: () => void;
}

const HelpTour = ({ run, onClose }: Props) => {
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
    getFinalStep(),
  ];

  return <GuidedTour steps={steps} run={run} onClose={onClose} />;
};

export default HelpTour;
