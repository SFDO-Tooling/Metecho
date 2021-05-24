import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Step } from 'react-joyride';

import GuidedTour from '~js/components/tour/guided';

interface Props {
  run: boolean;
  onClose: () => void;
}

const PlayTour = ({ run, onClose }: Props) => {
  const steps: Step[] = [
    {
      target: '.tour-create-scratch-org',
      title: i18n.t('View & play with project'),
      content: (
        <Trans i18nKey="tourPlayScratchOrg">
          Scratch Orgs are a temporary place for you to view the work on this
          Project. You can use Scratch Orgs to play with changes to the Project
          without affecting the Project.
        </Trans>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: '.tour-scratch-org-location',
      title: i18n.t('Scratch Org appears here'),
      content: (
        <Trans i18nKey="tourPlayScratchOrgLocation">
          Your Project Scratch Org will appear here. Create a Scratch Org for
          the entire Project, or visit an Epic or Task to create a Scratch Org
          for specific work in progress.
        </Trans>
      ),
      placement: 'left',
      disableBeacon: true,
    },
  ];

  return <GuidedTour steps={steps} run={run} onClose={onClose} />;
};

export default PlayTour;
