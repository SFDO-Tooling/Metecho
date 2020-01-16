import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import React from 'react';

interface TaskStatusPathProps {
  status: string;
}
const TaskStatusSteps = ({ status }: TaskStatusPathProps) => {
  const steps = [
    {
      label: 'Assign developer',
      step: 'Planned',
      key: 'assign-developer',
    },
    {
      label: 'Assign reviewer',
      step: 'Planned',
      key: 'assign-reviewer',
    },
    {
      label: 'Create a Scratch Org for development',
      step: 'In progress',
      key: 'create-scratch-org',
    },
    {
      label: 'Capture task changes',
      step: 'In progress',
      key: 'capture-task-changes',
    },
    {
      label: 'Submit task changes for review',
      step: 'In progress',
      key: 'submit-for-review',
    },
    {
      label: 'Create a QA Org for development',
      step: 'Completed',
      key: 'create-qa-org',
    },
  ];

  return (
    <RadioGroup label="Next Staps" disabled={false} name="steps">
      {steps.map(({ label, step, key }) => (
        <Radio
          key={key}
          id={key}
          labels={{ label }}
          value={key}
          checked={status === step}
          variant="base"
        />
      ))}
    </RadioGroup>
  );
};

export default TaskStatusSteps;
