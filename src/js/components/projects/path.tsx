import i18n from 'i18next';
import React from 'react';

import Path from '@/components/path';
import { Project } from '@/store/projects/reducer';
import { PROJECT_STATUSES } from '@/utils/constants';

const steps = [
  i18n.t('Planned'),
  i18n.t('In progress'),
  i18n.t('Review'),
  i18n.t('Merged'),
];

const ProjectStatusPath = ({ project }: { project: Project }) => {
  let activeIdx = 0;
  let isCompleted = false;
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
