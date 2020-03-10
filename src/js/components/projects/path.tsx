import i18n from 'i18next';
import React from 'react';

import Path from '@/components/path';
import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';
import { getCompletedTasks } from '@/utils/helpers';

const ProjectStatusPath = ({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) => {
  const steps = [
    i18n.t('Planned'),
    i18n.t('In progress'),
    i18n.t('Review'),
    i18n.t('Merged'),
  ];
  const inProgress = tasks?.find((task) => task.status === 'In progress');
  const allTasksComplete = getCompletedTasks(tasks).length === tasks.length;
  const isMerged = false; // Maybe a bool field on project for status
  const isCompleted = false;
  let activeIdx = 0;
  if (tasks?.length > 0) {
    if (inProgress) {
      activeIdx = 1;
    }
    if (project.pr_is_open && allTasksComplete) {
      activeIdx = 2;
    }
    if (isMerged) {
      activeIdx = 3;
    }
  }

  return <Path steps={steps} activeIdx={activeIdx} isCompleted={isCompleted} />;
};

export default ProjectStatusPath;
