import classNames from 'classnames';
import i18n from 'i18next';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';

import { Task } from '@/store/tasks/reducer';
import { TASK_STATUSES } from '@/utils/constants';

interface TaskStatusPathProps {
  task: Task;
}

const TaskStatusSteps = ({ task }: TaskStatusPathProps) => {
  const [completedSteps, setcompletedSteps] = useState<number[]>([]);
  const [nextSteps, setNextSteps] = useState<number[]>([]);

  useEffect(() => {
    const inProgressDone = task.has_unmerged_commits ? [0, 1] : [0, 1, 2, 3];
    const inProgressNext = task.has_unmerged_commits ? [3] : [4];
    let done: number[], next: number[];
    switch (task.status) {
      case TASK_STATUSES.PLANNED:
        done = [];
        next = [0, 1];
        break;
      case TASK_STATUSES.IN_PROGRESS:
        done = inProgressDone;
        next = inProgressNext;
        break;
      case TASK_STATUSES.COMPLETED:
        done = [0, 1, 2, 3, 4, 5]; // or maybe all the indexes of steps ?
        next = [];
        break;
    }
    setcompletedSteps(done);
    setNextSteps(next);
  }, [task]);
  const steps = [
    `${i18n.t('Assign developer')}`,
    `${i18n.t('Assign reviewer')}`,
    `${i18n.t('Create a Scratch Org for development')}`,
    `${i18n.t('Capture task changes')}`,
    `${i18n.t('Submit task changes for review')}`,
    `${i18n.t('Create a QA Org for development')}`,
  ];
  // @todo render different steps for login as dev or reviewer

  return (
    <>
      <h3>Next Steps</h3>
      {steps.map((item, index) => {
        const stepIsNext = _.includes(nextSteps, index);
        const stepIsComplete = _.includes(completedSteps, index);
        const statusClass = {
          'is-next': stepIsNext,
          'is-done': stepIsComplete,
        };

        return (
          <div className="ms-task-step " key={index}>
            {/* @todo make this an icon if done */}
            <span
              className={classNames(
                'ms-task-step-status',
                'slds-m-right_medium',
                statusClass,
              )}
            />
            <span>{item}</span>
          </div>
        );
      })}
    </>
  );
};

export default TaskStatusSteps;
