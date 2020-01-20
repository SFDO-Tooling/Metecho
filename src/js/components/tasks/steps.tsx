import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import classNames from 'classnames';
import React from 'react';

import { Task } from '@/store/tasks/reducer';
import { TASK_STATUSES } from '@/utils/constants';

interface TaskStatusPathProps {
  task: Task;
}

const TaskStatusSteps = ({ task }: TaskStatusPathProps) => {
  const steps = [
    'Assign developer',
    'Assign reviewer',
    'Create a Scratch Org for development',
    'Capture task changes',
    'Submit task changes for review',
    'Create a QA Org for development',
  ];
  const isNext = true;
  const isDone = false;
  // set class/styles based on if item is included in 'next' or 'done'
  const checkedStatus = classNames({
    'is-next': isNext,
    'is-done': isDone,
  });

  const inProgressDone = task.has_unmerged_commits ? [0, 1] : [0, 1, 2];
  const inProgressNext = task.has_unmerged_commits ? [3] : [4];
  let done, next;
  switch (task.status) {
    case TASK_STATUSES.PLANNED:
      done = null;
      next = [0, 1];
      break;
    case TASK_STATUSES.IN_PROGRESS:
      done = inProgressDone;
      next = inProgressNext;
      break;
    case TASK_STATUSES.COMPLETED:
      done = steps.length; // or maybe, all the indexes of steps ?
      next = null;
      break;
  }
  // @todo: assign the right classes based on if index is is done or next,
  // @todo render different steps for login as dev or reviewer

  return (
    <RadioGroup labels={{ label: 'Next Steps' }} disabled={false} name="steps">
      {steps.map((item, index) => (
        <Radio
          key={index}
          id={item}
          labels={{ label: item }}
          value={item}
          checked={true}
          variant="base"
          status={task.status}
          className={checkedStatus}
        />
      ))}
    </RadioGroup>
  );
};

export default TaskStatusSteps;
