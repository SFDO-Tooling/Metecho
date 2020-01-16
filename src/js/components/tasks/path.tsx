import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';
import { Task } from 'src/js/store/tasks/reducer';

import { TASK_STATUSES } from '@/utils/constants';

interface TaskStatusPathProps {
  task: Task;
}
const TaskStatusPath = ({ task }: TaskStatusPathProps) => {
  const { status } = task;
  const readyForDev = status === TASK_STATUSES.PLANNED;
  const readyForReview =
    status === TASK_STATUSES.IN_PROGRESS && !task.pr_is_open;
  // disabled is for showing the checkmark
  const test = [
    {
      label: 'Planned',
      isNext: false,
      active: readyForDev,
      complete: status === TASK_STATUSES.IN_PROGRESS || TASK_STATUSES.COMPLETED,
    },
    {
      label: 'In Progress',
      isNext: readyForDev,
      active: readyForReview,
      complete: task.pr_is_open,
    },
    {
      label: 'Review',
      active: task.pr_is_open,
      isNext: readyForReview,
      complete: task.pr_is_open && status !== TASK_STATUSES.COMPLETED,
    },
    {
      label: 'Merged',
      isNext: readyForReview,
      active: false,
      complete: false,
    },
  ];

  return (
    <div className="ms-task-status-path slds-path">
      <div className="slds-grid slds-path__track">
        <div className="slds-grid slds-path">
          <ul
            className="ms-task-status-path__list slds-path__nav slds-m-left_none"
            role="listbox"
            aria-orientation="horizontal"
          >
            {test.map(({ label, active, isNext, complete }) => (
              <li
                key={label}
                className={classNames(
                  'ms-task-status-path__item',
                  'slds-path__item',
                  {
                    'slds-is-current': active,
                    'slds-is-active': active,
                    'slds-is-incomplete': !isNext,
                    'slds-is-complete': label === 'Merged' && active,
                    'ms-path-checked': complete,
                  },
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
                  <span className="slds-path__title">
                    {complete ? (
                      <Icon
                        category="utility"
                        name="check"
                        assistiveText={{
                          label: i18n.t('Step Complete'),
                        }}
                        size="xx-small"
                        className="slds-m-bottom_xx-small"
                      />
                    ) : (
                      label
                    )}
                  </span>
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
