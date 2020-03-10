import i18n from 'i18next';
import React from 'react';

import Path from '@/components/path';
import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';

const ProjectStatusPath = ({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) => {
  const steps = [
    i18n.t('Planning'),
    i18n.t('In progress'),
    i18n.t('Review'),
    i18n.t('Merged'),
  ];
  const inProgress = tasks?.find((task) => task.status === 'In progress');
  const inReview = tasks?.find((task) => task.review_status);
  let activeIdx = 0;
  const isCompleted = false;
  if (tasks?.length > 0) {
    if (inProgress) {
      activeIdx = 1;
    }
    if (inReview) {
      activeIdx = 2;
    }
    if (project.pr_is_open) {
      activeIdx = 3;
    }
    /* if (condition for a merged project) {
      activeIdx = 4;
    }
    */
  }

  return <Path steps={steps} activeIdx={activeIdx} isCompleted={isCompleted} />;
};

export default ProjectStatusPath;
