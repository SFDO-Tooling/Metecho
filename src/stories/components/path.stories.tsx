import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import EpicStatusPath from '~js/components/epics/path';
import TaskStatusPath from '~js/components/tasks/path';
import { Task } from '~js/store/tasks/reducer';


import {
  sampleTask1,
  sampleTask2,
  sampleTask3,
  sampleTask4,
  sampleTask5,
} from '../fixtures';

import { EPIC_STATUSES } from '~js/utils/constants';

export default {
  title: 'Components/Path/Examples',
  component: TaskStatusPath,
};



const sampleTasks: { [key: string]: Task } = {
  Approved: sampleTask1,
  Planned: sampleTask2,
  Complete: sampleTask3,
  'Changes Requested': sampleTask4,
  'In Progress': sampleTask5,
};



const epicTemplate: Story<ComponentProps<typeof EpicStatusPath>> = (args) => (
  <EpicStatusPath {...args} />
);

export const EpicPath = epicTemplate.bind({});

EpicPath.args = {
  status: 'Review',
};
EpicPath.argTypes = {
  status: {
    defaultValue: Object.keys(EPIC_STATUSES),
    control: {
      type: 'select',
      options: Object.keys(EPIC_STATUSES),
    },
  },
};

EpicPath.storyName = 'Epic Path';




const taskTemplate: Story<ComponentProps<typeof TaskStatusPath>> = (args) => (
  <TaskStatusPath {...args} />
);

export const TaskPath = taskTemplate.bind({});

TaskPath.args = {
  task: sampleTask4,
};
TaskPath.argTypes = {
  tasks: {
    defaultValue: Object.keys(sampleTasks),
    control: {
      type: 'select',
      options: Object.keys(sampleTasks),
    },
  },
};

TaskPath.storyName = 'Task Path';
