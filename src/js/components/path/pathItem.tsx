import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';

interface PathItemProps {
  steps: string[];
  idx: number;
  activeIdx?: number;
  isCompleted?: boolean;
  isLost?: boolean;
}

const PathItem = ({
  steps,
  idx,
  activeIdx,
  isCompleted,
  isLost,
}: PathItemProps) => {
  const title = steps[idx];
  let isActive = false;
  let isComplete = false;
  let isIncomplete = true;
  let isWon = false;
  if (activeIdx !== undefined) {
    isActive = idx === activeIdx;
    isWon = Boolean(isActive && isCompleted && idx === steps.length - 1);
    isComplete = idx < activeIdx;
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
        'slds-is-lost': isLost && isActive && !isCompleted,
      })}
      role="presentation"
    >
      <a
        aria-selected={isActive}
        className="slds-path__link progress-bar-item"
        id={`path-${idx}`}
        role="option"
        tabIndex={isActive ? 0 : -1}
      >
        <span className="slds-path__stage">
          <Icon category="utility" name="check" size="x-small" />
          {(isActive || isComplete) && (
            <span className="slds-assistive-text">
              {isActive ? i18n.t('Current Stage:') : i18n.t('Stage Complete')}
            </span>
          )}
        </span>
        <span className="slds-path__title">{title}</span>
      </a>
    </li>
  );
};

export default PathItem;
