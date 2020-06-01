import i18n from 'i18next';
import React from 'react';

import StepsItem, { Step } from '@/components/steps/stepsItem';

const Steps = ({ steps }: { steps: Step[] }) => (
  <>
    <h3 className="slds-text-heading_medium slds-m-vertical_small">
      {i18n.t('Next Steps')}
    </h3>
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
