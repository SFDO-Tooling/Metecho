import i18n from 'i18next';
import React from 'react';

import Steps from '@/js/components/steps';
import { Step } from '@/js/components/steps/stepsItem';
import { Epic } from '@/js/store/epics/reducer';
import { Task } from '@/js/store/tasks/reducer';
import { EPIC_STATUSES } from '@/js/utils/constants';

interface EpicStatusStepsProps {
  epic: Epic;
  tasks: Task[];
  readyToSubmit: boolean;
  currentlySubmitting: boolean;
  canSubmit: boolean;
  handleAction: (step: Step) => void;
}

const EpicStatusSteps = ({
  epic,
  tasks,
  readyToSubmit,
  currentlySubmitting,
  canSubmit,
  handleAction,
}: EpicStatusStepsProps) => {
  const hasTasks = Boolean(tasks.length);
  const hasDev = tasks.some((task) => task.assigned_dev);
  const isMerged = epic.status === EPIC_STATUSES.MERGED;

  const steps: Step[] = [
    {
      label: i18n.t('Add a task'),
      active: !hasTasks,
      complete: hasTasks || isMerged,
    },
    {
      label: i18n.t('Assign a Developer to a task'),
      active: hasTasks && !hasDev,
      complete: epic.has_unmerged_commits || (hasTasks && hasDev) || isMerged,
    },
    {
      label: i18n.t('Complete a task'),
      active: hasTasks && hasDev,
      complete: epic.has_unmerged_commits || isMerged,
    },
    {
      label: currentlySubmitting
        ? i18n.t('Submitting epic for review on GitHub…')
        : i18n.t('Submit this epic for review on GitHub'),
      active: readyToSubmit,
      complete: epic.pr_is_open || isMerged,
      action: canSubmit && !currentlySubmitting ? 'submit' : undefined,
    },
    {
      label: i18n.t('Merge pull request on GitHub'),
      active: epic.pr_is_open,
      complete: isMerged,
      link: epic.pr_url,
    },
  ];

  return (
    <Steps
      steps={steps}
      title={i18n.t('Next Steps for this Epic')}
      handleAction={handleAction}
    />
  );
};

export default EpicStatusSteps;
