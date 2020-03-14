import ProgressBar from '@salesforce/design-system-react/components/progress-bar';
import React from 'react';
import { Trans } from 'react-i18next';

import { getPercentage } from '@/utils/helpers';

interface Props {
  range: [number, number];
}

const ProjectProgress = ({ range }: Props) => {
  const [complete, total] = range;
  const value = complete > 0 ? getPercentage(complete, total) : 0;
  return (
    <div className="project-process">
      <div className="slds-clearfix slds-m-bottom_xx-small">
        <strong className="slds-float_right">
          <Trans i18nKey="tasksComplete">
            {{ complete }} of {{ total }} Complete
          </Trans>
        </strong>
      </div>
      <ProgressBar
        value={value}
        thickness="small"
        color={complete > 0 && complete === total ? 'success' : undefined}
      />
    </div>
  );
};

export default ProjectProgress;
