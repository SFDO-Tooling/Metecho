import React from 'react';

import Path from '@/components/path';
import { Task } from '@/store/tasks/reducer';
import { REVIEW_STATUSES, TASK_STATUSES } from '@/utils/constants';
import { getSteps } from '@/utils/helpers';

const TaskStatusPath = ({ task }: { task: Task }) => {
  let activeIdx;
  let isCompleted = false;
  const steps = getSteps();
  const status =
    task.review_valid && task.status !== TASK_STATUSES.COMPLETED
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
    case REVIEW_STATUSES.CHANGES_REQUESTED:
      activeIdx = 1;
      break;
    case REVIEW_STATUSES.APPROVED:
      activeIdx = 3;
      break;
  }
  return <Path steps={steps} activeIdx={activeIdx} isCompleted={isCompleted} />;
};

export default TaskStatusPath;
