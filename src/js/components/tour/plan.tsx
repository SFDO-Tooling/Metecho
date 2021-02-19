import i18n from 'i18next';
import React, { useCallback } from 'react';
import { Trans } from 'react-i18next';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { useDispatch } from 'react-redux';

import { useIsMounted } from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { onboard } from '~js/store/user/actions';

interface Props {
  handleCallback: (data: CallBackProps) => void;
  run: boolean;
}

const steps: Step[] = [
  {
    target: '.tour-create-epic',
    content: (
      <Trans i18nKey="tourCreateEpic">
        Epics are groups of related Tasks, representing larger changes to the
        Project. You can invite multiple collaborators to your Epic and assign
        different people as Developers and Testers for each Task.
      </Trans>
    ),
    placement: 'right',
    disableBeacon: true,
  },
];

const PlanTour = ({ run, handleCallback }: Props) => {
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();

  const doOnboard = useCallback(
    (data: CallBackProps) => {
      dispatch(onboard()).finally(() => {
        /* istanbul ignore else */
        if (isMounted.current) {
          handleCallback(data);
        }
      });
    },
    [dispatch, isMounted, handleCallback],
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
      disableScrolling
      callback={doOnboard}
      styles={{
        options: {
          textColor: '#080707',
          primaryColor: '#0070d2',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
};
export default PlanTour;
