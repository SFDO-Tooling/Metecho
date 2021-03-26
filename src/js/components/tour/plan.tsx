import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import Joyride, {
  ACTIONS,
  CallBackProps,
  STATUS,
  status as StatusType,
  Step,
  StoreHelpers,
} from 'react-joyride';

import PopoverHeader from '~img/popover-header.png';

interface Props {
  run: boolean;
  onClose: () => void;
}

const PlanTour = ({ run, onClose }: Props) => {
  const [helpers, setHelpers] = useState<StoreHelpers | null>(null);

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
          If you would like to review this or any other walkthrough again,
          simply click the question mark. There is also a self-guided tour with
          more object and action explanations.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
  ];

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { action, status } = data;
      const finished: StatusType[keyof StatusType][] = [
        STATUS.FINISHED,
        STATUS.SKIPPED,
      ];
      if (finished.includes(status) || action === ACTIONS.CLOSE) {
        /* istanbul ignore else */
        if (helpers) {
          helpers.close();
        }
        onClose();
      }
    },
    [onClose, helpers],
  );

  return (
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
      showProgress
      disableScrolling
      getHelpers={setHelpers}
      callback={handleCallback}
      styles={{
        options: {
          arrowColor: '#032e61',
          backgroundColor: '#032e61',
          textColor: '#ffffff',
          primaryColor: '#0070d2',
        },
        buttonBack: {
          border: '1px solid #dddbda',
          borderRadius: '.25rem',
          color: '#ecebea',
          fontSize: '13px',
        },
        buttonNext: {
          fontSize: '13px',
        },
        buttonSkip: {
          border: '1px solid #0070d2',
          fontSize: '13px',
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
          backgroundImage: `url(${PopoverHeader})`,
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
};

export default PlanTour;
