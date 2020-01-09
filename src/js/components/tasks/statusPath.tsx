import classNames from 'classnames';
import i18n from 'i18next';
import React, { useState } from 'react';
const statusLabels = ['Planned', 'In Progress', 'Review', 'Merged'];

// mocking for now //
const hasDev = false;
const hasReviewer = false;

const StatusPath = () => {
  const status = {
    active: !hasDev && !hasReviewer,
    complete: false,
    disabled: false,
    merged: false,
  };

  const statusClass = {
    'slds-is-current': status.active,
    'slds-is-active': status.active,
    'slds-is-incomplete': status.complete,
    'slds-is-complete': status.merged,
  };
  return (
    <div className="slds-path">
      <div className="slds-grid slds-path__track">
        <div className="slds-grid slds-path">
          <ul
            className="slds-path__nav status-path__list slds-m-left_none"
            role="listbox"
            aria-orientation="horizontal"
          >
            {statusLabels.map((label) => (
              <li
                key={label}
                className={classNames(
                  'slds-path__item',
                  'status-path__item',
                  statusClass,
                )}
                role="presentation"
              >
                <a
                  aria-selected="true"
                  className="slds-path__link"
                  id="path-1"
                  role="option"
                >
                  <span className="slds-path__stage">
                    <span className="slds-assistive-text">Current Stage:</span>
                  </span>
                  <span className="slds-path__title">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StatusPath;
