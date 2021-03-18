import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import PopoverHeader from '~img/popover-header.png';

interface Props {
  handleCallback: (data: CallBackProps) => void;
  run: boolean;
}

const steps: Step[] = [
  {
    target: '.tour-create-epic',
    title: (
      <Trans i18nKey="tourCreateEpicTitle">
        Create epics to group tasks
      </Trans>
    ),
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
];

const PlanTour = ({ run, handleCallback }: Props) => (
  <Joyride
    steps={steps}
    run={run}
    locale={{
      back: i18n.t('Back'),
      close: i18n.t('Close'),
      last: i18n.t('Close'),
      next: i18n.t('Next'),
    }}
    continuous
    disableScrolling
    callback={handleCallback}
    styles={{
      options: {
        arrowColor: '#032e61',
        backgroundColor: '#032e61',
        textColor: '#ffffff',
        primaryColor: '#0070d2',
      },
      tooltip: {
        padding: '0',
      },
      tooltipContainer: {
        textAlign: 'left',
      },
      tooltipContent: {
        fontSize: '.8125rem',
        padding: '1rem',
      },
      tooltipTitle: {
        backgroundColor: '#164a85',
        backgroundImage: "url(" + PopoverHeader + ")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'bottom',
        backgroundSize: 'contain',
        borderBottom: '1px solid #ffffff',
        fontSize: '1.25rem',
        fontWeight: 300,
        padding: '0.75rem 1rem',
        textShadow: '0 0 4px #032e61',
      },
      tooltipFooter: {
        margin: 0,
        padding: '1rem',
      },
    }}
    floaterProps={{
      disableAnimation: true,
    }}
  />
);
export default PlanTour;
