import React from 'react';

import Path from '@/components/path';
import { PROJECT_STATUSES, ProjectStatuses } from '@/utils/constants';
import { getSteps } from '@/utils/helpers';

interface Props {
  status: ProjectStatuses;
}

const ProjectStatusPath = ({ status }: Props) => {
  let activeIdx = 0;
  let isCompleted = false;
  const steps = getSteps();
  switch (status) {
    case PROJECT_STATUSES.IN_PROGRESS:
      activeIdx = 1;
      break;
    case PROJECT_STATUSES.REVIEW:
      activeIdx = 2;
      break;
    case PROJECT_STATUSES.MERGED:
      activeIdx = 3;
      isCompleted = true;
      break;
  }
  return (
    <div className="slds-p-bottom_x-large">
      <Path steps={steps} activeIdx={activeIdx} isCompleted={isCompleted} />
    </div>
  );
};

export default ProjectStatusPath;
