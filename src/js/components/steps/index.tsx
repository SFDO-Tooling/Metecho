import React from 'react';

import StepsItem, { Step } from '@/js/components/steps/stepsItem';

const Steps = ({
  steps,
  title,
  handleAction,
}: {
  steps: Step[];
  title: string;
  handleAction?: (step: Step) => void;
}) => {
  const someAssignees = steps.some((i) => i.assignee);
  return (
    <>
      <h3 className="slds-text-heading_medium slds-m-bottom_small">{title}</h3>
      <div className="slds-progress slds-progress_vertical">
        <ol className="slds-progress__list">
          {steps
            .filter((step) => !step.hidden)
            .map((step, idx) => (
              <StepsItem
                key={idx}
                step={step}
                someAssignees={someAssignees}
                handleAction={handleAction}
              />
            ))}
        </ol>
      </div>
    </>
  );
};

export default Steps;
