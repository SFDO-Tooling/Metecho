import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import TasksTableComponent from '@/js/components/tasks/table';
import { Task } from '@/js/store/tasks/reducer';

import { withRedux } from '../../decorators';
import {
  sampleEpic1,
  sampleGitHubUser1,
  sampleGitHubUser2,
  sampleGitHubUser3,
  sampleProject1,
  sampleTask1,
  sampleTask2,
  sampleTask3,
  sampleTask4,
  sampleTask5,
  sampleTask6,
} from '../../fixtures';

export default {
  title: 'Tasks/Table/Example',
  component: TasksTableComponent,
  decorators: [
    withRedux({
      user: { github_id: sampleGitHubUser2.id },
      projects: { projects: [sampleProject1] },
    }),
  ],
};

const sampleTasks: { [key: string]: Task } = {
  Approved: sampleTask1,
  Planned: sampleTask2,
  Complete: sampleTask3,
  'Changes Requested': sampleTask4,
  'In Progress': sampleTask5,
  Test: sampleTask6,
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
  tasks: Object.keys(sampleTasks),
  projectId: sampleProject1.id,
  projectSlug: sampleProject1.slug,
  epicSlug: sampleEpic1.slug,
  epicUsers: [sampleGitHubUser1],
  githubUsers: [sampleGitHubUser1, sampleGitHubUser2, sampleGitHubUser3],
  canAssign: true,
  isRefreshingUsers: false,
  assignUserAction: action('assignUserAction'),
};
TasksTable.argTypes = {
  tasks: {
    options: Object.keys(sampleTasks),
    control: {
      type: 'multi-select',
    },
  },
  epicUsers: { control: { disable: true } },
};
TasksTable.storyName = 'Example';
