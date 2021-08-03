import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import EpicStatusPath from '@/js/components/epics/path';
import Path from '@/js/components/path';
import TaskStatusPath from '@/js/components/tasks/path';
import { Task } from '@/js/store/tasks/reducer';
import { EPIC_STATUSES } from '@/js/utils/constants';

import {
  sampleTask1,
  sampleTask2,
  sampleTask3,
  sampleTask4,
  sampleTask5,
} from '../fixtures';

export default {
  title: 'Components/Path/Examples',
  component: Path,
};

const sampleTaskStatuses: { [key: string]: Task } = {
  Planned: sampleTask2,
  'In progress': sampleTask5,
  Test: { ...sampleTask5, pr_is_open: true },
  'Changes Requested': sampleTask4,
  Approved: sampleTask1,
  Complete: sampleTask3,
};

type TaskPathProps = ComponentProps<typeof TaskStatusPath>;
interface TaskStoryProps extends Omit<TaskPathProps, 'task'> {
  status: string;
}

const TaskTemplate = ({ status, ...rest }: TaskStoryProps) => (
  <TaskStatusPath task={sampleTaskStatuses[status]} {...rest} />
);
export const TaskPath: Story<TaskStoryProps> = TaskTemplate.bind({});
TaskPath.args = {
  status: 'Planned',
};
TaskPath.argTypes = {
  status: {
    options: Object.keys(sampleTaskStatuses),
    control: {
      type: 'select',
    },
  },
};
TaskPath.storyName = 'Task Path';

type EpicPathProps = ComponentProps<typeof EpicStatusPath>;
interface EpicStoryProps extends Omit<EpicPathProps, 'status' | 'prIsOpen'> {
  status: string;
}

const sampleEpicStatuses: { [key: string]: EpicPathProps } = {
  Planned: { status: EPIC_STATUSES.PLANNED, prIsOpen: false },
  'In progress': { status: EPIC_STATUSES.IN_PROGRESS, prIsOpen: false },
  Review: { status: EPIC_STATUSES.REVIEW, prIsOpen: false },
  'Ready for Merge': { status: EPIC_STATUSES.REVIEW, prIsOpen: true },
  Merged: { status: EPIC_STATUSES.MERGED, prIsOpen: false },
};

const EpicTemplate = ({ status, ...rest }: EpicStoryProps) => (
  <EpicStatusPath
    status={sampleEpicStatuses[status].status}
    prIsOpen={sampleEpicStatuses[status].prIsOpen}
    {...rest}
  />
);
export const EpicPath: Story<EpicStoryProps> = EpicTemplate.bind({});
EpicPath.args = {
  status: 'Planned',
};
EpicPath.argTypes = {
  status: {
    options: Object.keys(sampleEpicStatuses),
    control: {
      type: 'select',
    },
  },
};
EpicPath.storyName = 'Epic Path';
