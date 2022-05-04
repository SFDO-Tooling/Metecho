import React from 'react';
import { useTranslation } from 'react-i18next';

import Path from '@/js/components/path';
import { Task } from '@/js/store/tasks/reducer';
import { REVIEW_STATUSES, TASK_STATUSES } from '@/js/utils/constants';

const TaskStatusPath = ({ task }: { task: Task }) => {
  const { t } = useTranslation();

  let activeIdx;
  let isCompleted = false;
  let isLost = false;
  const steps = [
    t('Planned'),
    t('In progress'),
    task.status === TASK_STATUSES.CANCELED ? t('Canceled') : t('Test'),
    t('Merged'),
  ];
  const status =
    task.review_valid && task.status === TASK_STATUSES.IN_PROGRESS
      ? task.review_status
      : task.status;
  switch (status) {
    case TASK_STATUSES.PLANNED:
      activeIdx = 0;
      break;
    case TASK_STATUSES.IN_PROGRESS:
      if (task.pr_is_open) {
        activeIdx = 2;
      } else {
        activeIdx = 1;
      }
      break;
    case TASK_STATUSES.COMPLETED:
      activeIdx = 3;
      isCompleted = true;
      break;
    case TASK_STATUSES.CANCELED:
      activeIdx = 2;
      isLost = true;
      break;
    case REVIEW_STATUSES.CHANGES_REQUESTED:
      activeIdx = 1;
      break;
    case REVIEW_STATUSES.APPROVED:
      activeIdx = 3;
      break;
  }

  return (
    <Path
      steps={steps}
      activeIdx={activeIdx}
      isCompleted={isCompleted}
      isLost={isLost}
    />
  );
};

export default TaskStatusPath;
