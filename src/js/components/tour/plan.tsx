import React from 'react';
import { Trans } from 'react-i18next';
import Joyride, { CallBackProps, Step } from 'react-joyride';

import beaconStyles from '~js/components/tour/beaconStyles';
interface Props {
  joyride: {
    callback?: (data: any) => void;
  };
  handleCallback: (data: CallBackProps) => void;
  run: boolean;
}

const steps: Step[] = [
  {
    target: '.create-epic',
    content: (
      <Trans i18nKey="whatsAnEpic">
        Epics are groups of related Tasks, representing larger changes to the
        Project. You can invite multiple Collaborators to your Epic and assign
        different people as Developers and Testers for each Task.
      </Trans>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.epic-name-column',
    content: (
      <Trans i18nKey="epicNameHelper">
        Here is some information on the names of Epics in a project
      </Trans>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.epic-status-column',
    content: (
      <Trans i18nKey="epicStatusHelper">
        You can assign yourself as tester any time. When the Task has a status
        of Review, you can begin testing.
      </Trans>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.epic-collaborators-column',
    content: (
      <Trans i18nKey="epicCollaboratorsHelper">
        Here is some information on project collaborators
      </Trans>
    ),
    placement: 'right',
    disableBeacon: true,
  },
];

const PlanTour = (props: Props) => (
  <Joyride
    steps={steps}
    continuous={true}
    showSkipButton={true}
    run={props.run}
    locale={{
      last: 'Close',
      skip: 'Skip',
    }}
    styles={beaconStyles}
    callback={props.handleCallback}
  />
);

export default PlanTour;
