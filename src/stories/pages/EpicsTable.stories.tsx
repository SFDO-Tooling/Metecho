import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import EpicsTableComponent from '~js/components/epics/table';
import { EPIC_STATUSES } from '~js/utils/constants';

export default {
  title: 'Pages/Epics/Table/Component',
  component: EpicsTableComponent,
  description: 'something here',
};

const Template: Story<ComponentProps<typeof EpicsTableComponent>> = (args) => (
  <EpicsTableComponent {...args} />
);

export const EpicsTable = Template.bind({});
EpicsTable.args = {
  epics: [
    {
      id: 'e1',
      project: 'my-project',
      name: 'My Epic',
      slug: 'my-epic',
      old_slugs: [],
      description: 'Epic Description',
      description_rendered: '<p>Epic Description</p>',
      branch_name: 'feature/my-epic',
      branch_url: 'https://github.com/test/test-repo/tree/feature/my-epic',
      branch_diff_url:
        'https://github.com/test/test-repo/compare/main...feature/my-epic',
      pr_url: null,
      pr_is_open: false,
      pr_is_merged: false,
      has_unmerged_commits: false,
      currently_creating_pr: false,
      currently_fetching_org_config_names: false,
      github_users: [],
      status: EPIC_STATUSES.PLANNED,
      available_task_org_config_names: [],
    },
    {
      id: 'e2',
      project: 'my-project',
      name: 'Mid-Year Project Saturn',
      slug: 'midyear-project-saturn',
      old_slugs: [],
      description:
        'Stabilize existing structures and provide clarity to team members.',
      description_rendered:
        '<p>Stabilize existing structures and provide clarity to team members.</p>',
      branch_name: 'feature/midyear-project-saturn',
      branch_url:
        'https://github.com/test/test-repo/tree/feature/midyear-project-saturn',
      branch_diff_url:
        'https://github.com/test/test-repo/compare/main...feature/midyear-project-saturn',
      pr_url: 'https://github.com/test/test-repo/pull/1234',
      pr_is_open: true,
      pr_is_merged: false,
      has_unmerged_commits: true,
      currently_creating_pr: false,
      currently_fetching_org_config_names: false,
      github_users: [
        {
          id: '123456',
          login: 'TestGitHubUser',
          avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
        },
        {
          id: '234567',
          login: 'OtherUser',
          avatar_url: 'https://randomuser.me/api/portraits/women/12.jpg',
        },
        {
          id: '345678',
          login: 'ThirdUser',
          avatar_url: 'https://randomuser.me/api/portraits/men/123.jpg',
        },
      ],
      status: EPIC_STATUSES.IN_PROGRESS,
      available_task_org_config_names: [],
    },
    {
      id: 'e3',
      project: 'my-project',
      name: 'Regular Database Backups',
      slug: 'database-backups',
      old_slugs: [],
      description: 'Fulfilling the requirements to access specific tech specs.',
      description_rendered:
        '<p>Fulfilling the requirements to access specific tech specs.</p>',
      branch_name: 'feature/database-backups',
      branch_url:
        'https://github.com/test/test-repo/tree/feature/database-backups',
      branch_diff_url:
        'https://github.com/test/test-repo/compare/main...feature/database-backups',
      pr_url: null,
      pr_is_open: false,
      pr_is_merged: false,
      has_unmerged_commits: false,
      currently_creating_pr: false,
      currently_fetching_org_config_names: false,
      github_users: [],
      status: EPIC_STATUSES.PLANNED,
      available_task_org_config_names: [],
    },
    {
      id: 'e4',
      project: 'my-project',
      name: 'Data Controls',
      slug: 'data-controls',
      old_slugs: [],
      description: 'Links the controller field to the static items',
      description_rendered:
        '<p>Links the controller field to the static items</p>',
      branch_name: 'feature/data-controls',
      branch_url:
        'https://github.com/test/test-repo/tree/feature/data-controls',
      branch_diff_url:
        'https://github.com/test/test-repo/compare/main...feature/data-controls',
      pr_url: null,
      pr_is_open: false,
      pr_is_merged: false,
      has_unmerged_commits: false,
      currently_creating_pr: false,
      currently_fetching_org_config_names: false,
      github_users: [],
      status: EPIC_STATUSES.MERGED,
      available_task_org_config_names: [],
    },
  ],
  projectSlug: 'my-project',
};
