import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

import { Task } from '@/store/tasks/reducer';
import { TASK_STATUSES } from '@/utils/constants';

interface TaskStatusPathProps {
  task: Task;
}

const TaskStatusSteps = ({ task }: TaskStatusPathProps) => {
  const [completedSteps, setcompletedSteps] = useState([]);
  const [nextSteps, setNextSteps] = useState([]);

  useEffect(() => {
    const inProgressDone = task.has_unmerged_commits ? [0, 1] : [0, 1, 2, 3]; // @todo this one might be wrong
    const inProgressNext = task.has_unmerged_commits ? [3] : [4];
    let done, next;
    switch (task.status) {
      case TASK_STATUSES.PLANNED:
        done = [];
        next = [0, 1];
        break;
      case TASK_STATUSES.IN_PROGRESS:
        done = inProgressDone;
        next = inProgressNext;
        break;
      case TASK_STATUSES.COMPLETED:
        done = [0, 1, 2, 3, 4, 5]; // or maybe all the indexes of steps ?
        next = [];
        break;
    }
    setcompletedSteps(done);
    setNextSteps(next);
  }, [task]);
  const steps = [
    'Assign developer',
    'Assign reviewer',
    'Create a Scratch Org for development',
    'Capture task changes',
    'Submit task changes for review',
    'Create a QA Org for development',
  ];
  // @todo render different steps for login as dev or reviewer

  console.log(completedSteps, nextSteps);
  return (
    <RadioGroup labels={{ label: 'Next Steps' }} disabled={false} name="steps">
      {steps.map((item, index) => {
        const stepIsNext = _.includes(nextSteps, index);
        const stepIsComplete = _.includes(completedSteps, index);
        const checkedStatus = classNames({
          'is-next': stepIsNext,
          'is-done': stepIsComplete,
        });
        return (
          <Radio
            key={index}
            id={item}
            labels={{ label: item }}
            value={item}
            variant="base"
            status={task.status}
            className={checkedStatus}
          />
        );
      })}
    </RadioGroup>
  );
};

export default TaskStatusSteps;
