import ProgressBar from '@salesforce/design-system-react/components/progress-bar';
import React from 'react';

import { getPercentage } from '@/utils/helpers';

interface Props {
  range: [number, number];
}
const ProjectProgress = ({ range }: Props) => {
  const value = getPercentage(range[0], range[1]);
  return (
    <div className="project-process">
      <div className="slds-clearfix">
        <span className="slds-float_right">
          {range[0]} of {range[1]} Complete
        </span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
};

export default ProjectProgress;
