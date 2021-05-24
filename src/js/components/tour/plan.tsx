import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Step } from 'react-joyride';

import GuidedTour, { getFinalStep } from '~js/components/tour/guided';

interface Props {
  run: boolean;
  onClose: () => void;
}

const PlanTour = ({ run, onClose }: Props) => {
  const steps: Step[] = [
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

  return <GuidedTour steps={steps} run={run} onClose={onClose} />;
};

export default PlanTour;
