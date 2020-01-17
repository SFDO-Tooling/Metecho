import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import _ from 'lodash';
import React from 'react';

interface PathItemProps {
  title: string;
  activeStep: {};
  previousSteps: Array<string>;
  lastIndex: number;
  stepIndex: any;
}
const PathItem = ({
  title,
  activeStep,
  previousSteps,
  lastIndex,
  stepIndex,
}: PathItemProps) => {
  const itemComplete = _.includes(previousSteps, stepIndex);
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
        {/* @todo add check icon... */}
        <span className="slds-path__title">
          {itemComplete ? (
            <Icon
              category="utility"
              name="check"
              size="x-small"
              className="slds-m-bottom_xxx-small"
            />
          ) : (
            title
          )}
        </span>
      </a>
    </li>
  );
};

export default PathItem;
