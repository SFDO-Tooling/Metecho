import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import React from 'react';

interface PathItemProps {
  steps: string[];
  idx: number;
  activeIdx?: number;
  isCompleted?: boolean;
}

const PathItem = ({ steps, idx, activeIdx, isCompleted }: PathItemProps) => {
  const title = steps[idx];
  let isActive = false;
  let isComplete = false;
  let isIncomplete = true;
  let isWon = false;
  if (activeIdx !== undefined) {
    isActive = idx === activeIdx;
    isWon = Boolean(isCompleted && idx === steps.length - 1);
    isComplete = idx < activeIdx || (isActive && isWon);
    isIncomplete = idx > activeIdx;
  }

  return (
    <li
      className={classNames('slds-path__item', {
        'slds-is-current': isActive,
        'slds-is-active': isActive,
        'slds-is-incomplete': isIncomplete,
        'slds-is-complete': isComplete,
        'slds-is-won': isWon,
      })}
      role="presentation"
    >
      <a
        aria-selected={isActive}
        className="slds-path__link"
        id={`path-${idx}`}
        role="option"
        tabIndex={isActive ? 0 : -1}
      >
        <span className="slds-path__stage">
          <Icon category="utility" name="check" size="x-small" />
          {(isActive || isComplete) && (
            <span className="slds-assistive-text">
              {isActive ? 'Current Stage:' : 'Stage Complete'}
            </span>
          )}
        </span>
        <span className="slds-path__title">{title}</span>
      </a>
    </li>
  );
};

export default PathItem;
