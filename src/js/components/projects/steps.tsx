import i18n from 'i18next';
import React from 'react';

import Steps from '@/components/steps';
import { Step } from '@/components/steps/stepsItem';
import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';
import { PROJECT_STATUSES } from '@/utils/constants';

interface ProjectStatusStepsProps {
  project: Project;
  tasks: Task[];
  handleAction: (action: Step[]) => void;
}

const ProjectStatusSteps = ({
  project,
  tasks,
  handleAction,
}: ProjectStatusStepsProps) => {
  const hasTasks = Boolean(tasks.length);
  const hasDev = tasks.some((task) => task.assigned_dev);
  const isMerged = project.status === PROJECT_STATUSES.MERGED;

  const steps = [
    {
      label: `${i18n.t('Create a task')}`,
      active: !hasTasks,
      complete: hasTasks,
      action: 'create',
    },
    {
      label: `${i18n.t('Assign a Developer to a task')}`,
      active: hasTasks && !hasDev,
      complete: project.has_unmerged_commits || (hasTasks && hasDev),
    },
    {
      label: `${i18n.t('Complete a task')}`,
      active: hasTasks && hasDev,
      complete: project.has_unmerged_commits,
    },
    {
      label: `${i18n.t('Submit this project for review on GitHub')}`,
      active: project.has_unmerged_commits,
      complete: project.pr_is_open || isMerged,
      action: 'submit',
    },
    {
      label: `${i18n.t('Merge pull request on GitHub')}`,
      active: project.pr_is_open,
      complete: isMerged,
      action: 'merge',
    },
  ];
  const activeStep = steps.filter((s) => s.active);

  return (
    <Steps
      steps={steps}
      title={i18n.t('Next Steps for this Project')}
      handleCurrentAction={() => handleAction(activeStep)}
    />
  );
};

export default ProjectStatusSteps;
