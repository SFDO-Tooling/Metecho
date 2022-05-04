import * as i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Joyride, {
  ACTIONS,
  CallBackProps,
  EVENTS,
  STATUS,
  status as StatusType,
  Step,
  StoreHelpers,
} from 'react-joyride';

import tourStyles from '@/js/components/tour/styles';

export interface TourProps {
  run: boolean;
  onStart?: () => void;
  onClose?: () => void;
  onBeforeStep?: (index: number) => void;
}

interface Props extends TourProps {
  steps: Step[];
}

export const getFinalStep = (): Step => ({
  target: '.tour-walkthroughs',
  title: i18n.t('Review walkthroughs any time') as string,
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

const GuidedTour = ({ steps, run, onStart, onClose, onBeforeStep }: Props) => {
  const { t } = useTranslation();
  const [helpers, setHelpers] = useState<StoreHelpers | null>(null);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { action, status, type, index } = data;
      const finished: StatusType[keyof StatusType][] = [
        STATUS.FINISHED,
        STATUS.SKIPPED,
      ];
      if (finished.includes(status) || action === ACTIONS.CLOSE) {
        helpers?.reset(false);
        onClose?.();
      }
      const starting: string[] = [EVENTS.TOUR_START, EVENTS.TOUR_STATUS];
      if (action === ACTIONS.START && starting.includes(type)) {
        onStart?.();
      }
      if (type === EVENTS.STEP_BEFORE) {
        onBeforeStep?.(index);
      }
    },
    [helpers, onClose, onStart, onBeforeStep],
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      locale={{
        back: t('Back'),
        close: t('Close'),
        last: t('Close'),
        next: t('Next'),
      }}
      continuous
      showProgress
      disableScrolling
      hideBackButton
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
