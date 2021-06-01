import ProgressBar from '@salesforce/design-system-react/components/progress-bar';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import TourPopover from '~js/components/tour/popover';
import { getPercentage } from '~js/utils/helpers';

interface Props {
  range: [number, number];
}

const EpicProgress = ({ range }: Props) => {
  const [complete, total] = range;
  const value = getPercentage(complete, total);
  return (
    <div className="epic-progress">
      <div className="slds-clearfix slds-m-bottom_xx-small">
        <strong className="slds-float_right slds-is-relative">
          <Trans i18nKey="tasksComplete">
            {{ complete }} of {{ total }} Complete
          </Trans>
          <TourPopover
            align="top"
            heading={i18n.t('Task progress bar')}
            body={
              <Trans i18nKey="tourTaskProgressBar">
                A quick reference to show what percentage of an Epic is complete
                based on the number of Tasks that are complete.
              </Trans>
            }
          />
        </strong>
      </div>
      <ProgressBar
        value={value}
        thickness="small"
        color={value === 100 ? 'success' : undefined}
      />
    </div>
  );
};

export default EpicProgress;
