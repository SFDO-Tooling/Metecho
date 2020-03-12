import ProgressBar from '@salesforce/design-system-react/components/progress-bar';
import React from 'react';
import { Trans } from 'react-i18next';

import { getPercentage } from '@/utils/helpers';

interface Props {
  range: [number, number];
}
const ProjectProgress = ({ range }: Props) => {
  const [complete, total] = range;
  const value = getPercentage(complete, total);
  return (
    <div className="project-process">
      <div className="slds-clearfix">
        <span className="slds-float_right">
          <Trans i18nKey="tasksComplete">
            {{ complete }} of {{ total }} Complete
          </Trans>
        </span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
};

export default ProjectProgress;
