import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import TasksTableComponent from '~js/components/tasks/table';

import { withRedux } from '../decorators';
import {
  sampleEpic1,
  sampleGitHubUser1,
  sampleGitHubUser2,
  sampleGitHubUser3,
  sampleTask1,
} from '../fixtures';

export default {
  title: 'Tasks/Table/Component',
  component: TasksTableComponent,
  decorators: [
    withRedux({
      user: {
        id: 'user-id',
        username: 'currentUser',
      },
    }),
  ],
};

const Template: Story<ComponentProps<typeof TasksTableComponent>> = (args) => (
  <TasksTableComponent {...args} />
);

export const Component = Template.bind({});
Component.args = {
  projectSlug: 'my-project',
  epicSlug: sampleEpic1.slug,
  tasks: [sampleTask1],
  epicUsers: [sampleGitHubUser1, sampleGitHubUser2, sampleGitHubUser3],
  openAssignEpicUsersModal: action('openAssignEpicUsersModal'),
  assignUserAction: action('assignUserAction'),
};
