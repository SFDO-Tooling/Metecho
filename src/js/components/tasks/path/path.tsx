import React, { CElement, Children, cloneElement, ReactNode } from 'react';

// tracks currentStep, status, previousSteps array
interface PathProps {
  current: number;
  children: ReactNode;
  status: string;
  previousSteps: any;
}
const Path = ({ current, children, status, previousSteps }: PathProps) => {
  const filteredChildren = React.Children.toArray(children).filter((c) =>
    Boolean(c),
  );
  const lastIndex = filteredChildren.length - 1;

  return (
    <div className="ms-task-status-path slds-path">
      <div className="slds-grid slds-path__track">
        <div className="slds-grid slds-path">
          <ul
            className="ms-task-status-path__list slds-path__nav slds-m-left_none"
            role="listbox"
            aria-orientation="horizontal"
          >
            {Children.map(
              filteredChildren,
              (child: CElement<HTMLElement, any>, index) => {
                if (!child) {
                  return null;
                }
                const stepNumber = 0 + index; // not sure of what this is for right now...
                const childProps = {
                  stepNumber: `${stepNumber + 1}`,
                  stepIndex: stepNumber,
                  status,
                  previousSteps,
                  activeStep: false,
                  lastIndex,
                };
                childProps.activeStep = stepNumber === current;

                return cloneElement(child, childProps);
              },
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Path;
