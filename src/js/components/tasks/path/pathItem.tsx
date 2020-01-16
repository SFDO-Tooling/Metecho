import classNames from 'classnames';
import _ from 'lodash';
import React from 'react';

interface PathItemProps {
  title: string;
  activeStep: {};
  previousSteps: Array<string>;
  lastIndex: number;
}
const PathItem = ({
  title,
  activeStep,
  previousSteps,
  lastIndex,
}: PathItemProps) => {
  const itemComplete = _.includes(previousSteps, title);
  const classes = classNames(
    activeStep ? ['slds-is-current', 'slds-is-active'] : 'slds-is-incomplete',
    activeStep === lastIndex ? 'slds-is-complete' : null,
    itemComplete ? 'ms-path-checked' : null,
  );
  return (
    <li
      className={classNames(
        'ms-task-status-path__item',
        'slds-path__item',
        'slds-is-incomplete',
        classes,
      )}
      role="presentation"
    >
      <a
        aria-selected="true"
        className="slds-path__link"
        id="path-1"
        role="option"
      >
        {activeStep && (
          <span className="slds-path__stage">
            <span className="slds-assistive-text">Current Stage:</span>
          </span>
        )}
        <span className="slds-path__title">{itemComplete ? '✓' : title}</span>
      </a>
    </li>
  );
};

export default PathItem;
