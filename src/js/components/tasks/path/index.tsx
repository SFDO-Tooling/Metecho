import React, { useEffect, useState } from 'react';

import { usePrev } from '@/components/utils';
import { Task } from '@/store/tasks/reducer';

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
  const [previousSteps, setPreviousSteps] = useState([]);
  const stepsRef = usePrev(currentStep);
  // add previous steps as complete
  useEffect(() => {
    if (currentStep >= 1) {
      setPreviousSteps((oldArray) =>
        [...oldArray, stepsRef].filter((item) => item !== currentStep),
      );
    }
  }, [currentStep, stepsRef]);
  // set the active step index
  useEffect(() => {
    const currentIdx = steps.findIndex((step) => step.status === task.status);
    if (task.pr_is_open) {
      setCurrentStep(2);
    } else {
      setCurrentStep(currentIdx);
    }
  }, [steps, task]);

  return (
    <Path
      current={currentStep}
      status={task.status}
      previousSteps={previousSteps}
    >
      {steps.map(({ label }, index) => (
        <PathItem title={label} key={index} />
      ))}
    </Path>
  );
};

export default TaskStatusPath;
