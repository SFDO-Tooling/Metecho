import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import TasksTableComponent from '~js/components/tasks/table';

import { withRedux } from '../decorators';

export default {
  title: 'Pages/Tasks/Table/Component',
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

export const TasksTable = Template.bind({});
TasksTable.args = {
  projectSlug: 'my-project',
  epicSlug: 'data-controls',
  tasks: [
    {
      id: 'M13MnQO',
      name: 'Data Mapping',
      description: 'This is a description',
      description_rendered: '<p>This is <em>safely</em> rendered Markdown.</p>',
      epic: '3Lw7OwK',
      assigned_dev: {
        id: '123456',
        login: 'TestGitHubUser',
        avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
      },
      assigned_qa: null,
      slug: 'test-task',
      old_slugs: [],
      has_unmerged_commits: true,
      currently_creating_pr: false,
      branch_name: 'feature/test-epic__test-task',
      branch_url:
        'https://github.com/SFDO-Tooling/test-project/tree/feature/test-epic__test-task',
      branch_diff_url:
        'https://github.com/SFDO-Tooling/test-project/compare/feature/test-epic...feature/test-epic__test-task',
      commits: [
        {
          id: '617a512',
          timestamp: '2019-02-01T19:47:49Z',
          author: {
            name: 'Full Name',
            username: 'TestGitHubUser',
            email: 'user@example.com',
            avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
          },
          message: 'Some commit message',
          url: 'https://github.com/SFDO-Tooling/commit/617a512',
        },
      ],
      origin_sha: '723b342',
      pr_url: 'https://github.com/SFDO-Tooling/test-project/pull/1357',
      pr_is_open: true,
      status: 'Planned',
      currently_submitting_review: false,
      review_submitted_at: '2019-03-01T19:47:49Z',
      review_valid: true,
      review_status: 'Approved',
      review_sha: '617a512',
      org_config_name: 'dev',
    },
  ],
  epicUsers: [
    {
      id: '123456',
      login: 'TestGitHubUser',
      avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
      id: '234567',
      login: 'OtherUser',
      avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg',
    },
    {
      id: '345678',
      login: 'ThirdUser',
      avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg',
    },
  ],
  openAssignEpicUsersModal: action('openAssignEpicUsersModal'),
  assignUserAction: action('assignUserAction'),
};
