import classNames from 'classnames';
import React from 'react';
const statusLabels = ['Planned', 'In Progress', 'Review', 'Merged'];

interface TaskStatusPathProps {
  status: string;
}
const TaskStatusPath = ({ status }: TaskStatusPathProps) => {
  const statusClass = {
    'slds-is-current': status === 'Planned',
    'slds-is-active': status === 'Planned',
    'slds-is-incomplete': status === 'In progress',
    'slds-is-complete': status === 'Complete',
  };

  return (
    <div className="ms-task-status-path slds-path">
      <div className="slds-grid slds-path__track">
        <div className="slds-grid slds-path">
          <ul
            className="ms-task-status-path__list slds-path__nav slds-m-left_none"
            role="listbox"
            aria-orientation="horizontal"
          >
            {statusLabels.map((label) => (
              <li
                key={label}
                className={classNames(
                  'ms-task-status-path__item',
                  'slds-path__item',
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
                  {status === 'In Progress' && (
                    <span className="slds-path__stage">
                      <span className="slds-assistive-text">
                        Current Stage:
                      </span>
                    </span>
                  )}
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

export default TaskStatusPath;
