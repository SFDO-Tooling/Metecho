import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import PathItem from '~js/components/tasks/path';
import { Task } from '~js/store/tasks/reducer';

import {
  sampleTask1,
  sampleTask2,
  sampleTask3,
  sampleTask4,
  sampleTask5,
} from '../fixtures';

export default {
  title: 'Tasks/Path/Example',
  component: PathItem,
};

const sampleTasks: { [key: string]: Task } = {
  Approved: sampleTask1,
  Planned: sampleTask2,
  Complete: sampleTask3,
  'Changes Requested': sampleTask4,
  'In Progress': sampleTask5,
};

type Props = ComponentProps<typeof PathItem>;

interface StoryProps extends Omit<Props, 'tasks'> {
  tasks: string[];
}

const Template = ({ task, ...rest }: StoryProps) => (
  <PathItem task={sampleTask4} />
);

export const Path: Story<StoryProps> = Template.bind({});
Path.args = { task: sampleTask4 };
Path.argTypes = {
  tasks: {
    defaultValue: Object.keys(sampleTasks),
    control: {
      type: 'radio',
      options: Object.keys(sampleTasks),
    },
  },
};

Path.storyName = 'Example';
