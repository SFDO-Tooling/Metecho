import React from 'react';

import Path from '@/components/path';
import { Project } from '@/store/projects/reducer';
import { PROJECT_STATUSES } from '@/utils/constants';
import { getSteps } from '@/utils/helpers';

const ProjectStatusPath = ({ project }: { project: Project }) => {
  let activeIdx = 0;
  let isCompleted = false;
  const steps = getSteps();
  const status = project.status;
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
  return <Path steps={steps} activeIdx={activeIdx} isCompleted={isCompleted} />;
};

export default ProjectStatusPath;
