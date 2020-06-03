import React from 'react';

import StepsItem, { Step } from '@/components/steps/stepsItem';

const Steps = ({ steps, title }: { steps: Step[]; title: string }) => (
  <>
    <h3 className="slds-text-heading_medium slds-m-vertical_small">{title}</h3>
    <div className="slds-progress slds-progress_vertical">
      <ol className="slds-progress__list">
        {steps
          .filter((step) => step.visible)
          .map((step, idx) => {
            const isActive = step.active && !step.complete;
            const hasAssignee = Boolean(step.assignee && !step.complete);
            return (
              <StepsItem
                key={idx}
                step={step}
                isActive={isActive}
                hasAssignee={hasAssignee}
              />
            );
          })}
      </ol>
    </div>
  </>
);

export default Steps;
