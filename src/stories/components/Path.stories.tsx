import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import Path from '~js/components/path';
import TaskStatusPath from '~js/components/tasks/path';
import { Task } from '~js/store/tasks/reducer';

import {
  sampleTask1,
  sampleTask2,
  sampleTask3,
  sampleTask4,
  sampleTask5,
} from '../fixtures';

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

type Props = ComponentProps<typeof Path>;
interface StoryProps extends Omit<Props, 'task'> {
  task: Task;
}
const TaskTemplate = ({ task, ...rest }: StoryProps) => (
  <TaskStatusPath
    task={Object.keys(sampleTasks).map((t) => sampleTasks[t])}
    {...rest}
  />
);
export const TaskPath: Story<StoryProps> = TaskTemplate.bind({});
TaskPath.args = {
  task: sampleTask4,
};
TaskPath.argTypes = {
  tasks: {
    defaultValue: Object.keys(sampleTasks)[0],
    control: {
      type: 'select',
      options: Object.keys(sampleTasks),
    },
  },
};
TaskPath.storyName = 'Task Path';
