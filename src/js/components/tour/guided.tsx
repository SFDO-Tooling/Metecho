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

import tourStyles from '@/js/components/tour/styles';

interface Props {
  steps: Step[];
  run: boolean;
  onClose: () => void;
}

export const getFinalStep = (): Step => ({
  target: '.tour-walkthroughs',
  title: i18n.t('Review walkthroughs any time'),
  content: (
    <Trans i18nKey="walkthroughDropdown">
      If you would like to review this or any other walkthrough, simply click
      the question mark. There is also a self-guided tour with more definitions
      and explanations.
    </Trans>
  ),
  placement: 'right',
  disableBeacon: true,
});

const GuidedTour = ({ steps, run, onClose }: Props) => {
  const [helpers, setHelpers] = useState<StoreHelpers | null>(null);

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
      styles={tourStyles}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
};

export default GuidedTour;
