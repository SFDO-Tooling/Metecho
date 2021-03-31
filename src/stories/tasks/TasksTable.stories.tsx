import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import TasksTableComponent from '~js/components/tasks/table';
import { Task } from '~js/store/tasks/reducer';

import { withRedux } from '../decorators';
import {
  sampleEpic1,
  sampleGitHubUser1,
  sampleGitHubUser2,
  sampleGitHubUser3,
  sampleTask1,
  sampleTask2,
  sampleTask3,
  sampleTask4,
  sampleTask5,
} from '../fixtures';

export default {
  title: 'Tasks/Table/Example',
  component: TasksTableComponent,
  decorators: [withRedux()],
};

const sampleTasks: { [key: string]: Task } = {
  Approved: sampleTask1,
  Planned: sampleTask2,
  Complete: sampleTask3,
  'Changes Requested': sampleTask4,
  'In Progress': sampleTask5,
};

type Props = ComponentProps<typeof TasksTableComponent>;

interface StoryProps extends Omit<Props, 'tasks'> {
  tasks: string[];
}

const Template = ({ tasks, ...rest }: StoryProps) => (
  <TasksTableComponent tasks={tasks.map((opt) => sampleTasks[opt])} {...rest} />
);

export const TasksTable: Story<StoryProps> = Template.bind({});
TasksTable.args = {
  projectSlug: 'my-project',
  epicSlug: sampleEpic1.slug,
  epicUsers: [sampleGitHubUser1, sampleGitHubUser2, sampleGitHubUser3],
  openAssignEpicUsersModal: action('openAssignEpicUsersModal'),
  assignUserAction: action('assignUserAction'),
};
TasksTable.argTypes = {
  tasks: {
    defaultValue: Object.keys(sampleTasks),
    options: Object.keys(sampleTasks),
    control: {
      type: 'multi-select',
    },
  },
  epicUsers: { control: { disable: true } },
};
TasksTable.storyName = 'Example';
