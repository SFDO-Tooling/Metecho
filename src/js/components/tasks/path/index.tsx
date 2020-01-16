import React, { useEffect, useState } from 'react';
import { Task } from 'src/js/store/tasks/reducer';

import Path from './path';
import PathItem from './pathItem';

interface TaskStatusPathProps {
  task: Task;
}
const TaskStatusPath = ({ task }: TaskStatusPathProps) => {
  const steps = [
    { label: 'Planned', status: 'Planned' },
    { label: 'In progress', status: 'In progress' },
    { label: 'Review', status: 'In progress', pr: task.pr_is_open },
    { label: 'Merged', status: 'Completed' },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  //   const [prevSteps, setPrevSteps] = useState([]); // @todo: set to an array of previous steps

  useEffect(() => {
    const currentIdx = steps.findIndex((step) => step.status === task.status);
    if (task.pr_is_open) {
      setCurrentStep(2);
    } else {
      setCurrentStep(currentIdx);
    }
  }, [steps, task]);

  return (
    <Path current={currentStep} status={task.status} previousSteps={[]}>
      {steps.map(({ label }, index) => (
        <PathItem title={label} key={index} />
      ))}
    </Path>
  );
};

export default TaskStatusPath;
