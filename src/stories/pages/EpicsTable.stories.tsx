import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import EpicsTableComponent from '~js/components/epics/table';

export default {
  title: 'Pages/Epics/Table/Component',
};

const Template: Story<ComponentProps<typeof EpicsTableComponent>> = (args) => (
  <EpicsTableComponent {...args} />
);

export const EpicsTable = Template.bind({});

EpicsTable.args = {
  epics: [
    {
      id: 'my-epic',
      project: 'my-project',
      name: 'My Epic',
      slug: 'my-epic',
      old_slugs: [],
      description: 'Epic Description',
      description_rendered: '<p>Epic Description</p>',
      branch_name: 'feature/my-epic',
      branch_url: 'https://github.com/test/test-repo/tree/my-project-my-epic',
      branch_diff_url:
        'https://github.com/test/test-repo/compare/my-project/my-project-my-epic',
      pr_url: null,
      pr_is_open: false,
      pr_is_merged: false,
      has_unmerged_commits: false,
      currently_creating_pr: false,
      currently_fetching_org_config_names: false,
      github_users: [],
      status: 'Planned',
      available_task_org_config_names: [],
    },
    {
      id: 'midyear-project-saturn',
      project: 'my-project',
      name: 'Mid-Year Project Saturn',
      slug: 'midyear-project-saturn',
      old_slugs: [],
      description:
        'Stabilize existing structures and provide clarity to team members.',
      description_rendered:
        '<p>Stabilize existing structures and provide clarity to team members.</p>',
      branch_name: 'feature/midyear-project-saturn',
      branch_url: 'https://github.com/test/test-repo/tree/my-project-my-epic',
      branch_diff_url:
        'https://github.com/test/test-repo/compare/my-project/my-project-my-epic',
      pr_url: null,
      pr_is_open: false,
      pr_is_merged: false,
      has_unmerged_commits: false,
      currently_creating_pr: false,
      currently_fetching_org_config_names: false,
      github_users: [1],
      status: 'In progress',
    },
    {
      id: 'regbackup',
      project: 'my-project',
      name: 'Regular Database Backups',
      slug: 'database-backups',
      description: 'Fulfilling the requirements to access specific tech specs.',
      description_rendered:
        '<p>Fulfilling the requirements to access specific tech specs.</p>',
      branch_name: 'feature/database-backups',
      branch_url: 'https://github.com/test/test-repo/tree/my-project-my-epic',
      branch_diff_url:
        'https://github.com/test/test-repo/compare/my-project/my-project-my-epic',
      pr_url: null,
      pr_is_open: false,
      pr_is_merged: false,
      has_unmerged_commits: false,
      currently_creating_pr: false,
      currently_fetching_org_config_names: false,
      github_users: [],
      status: 'Planned',
      available_task_org_config_names: [],
    },
    {
      id: 'datacontrols',
      project: 'my-project',
      name: 'Data Controls',
      slug: 'data-controls',
      description: 'Links the controller field to the static items',
      description_rendered:
        '<p>Links the controller field to the static items</p>',
      branch_name: 'feature/data-controls',
      branch_url: 'https://github.com/test/test-repo/tree/my-project-my-epic',
      branch_diff_url:
        'https://github.com/test/test-repo/compare/my-project/my-project-my-epic',
      pr_url: null,
      pr_is_open: false,
      pr_is_merged: false,
      has_unmerged_commits: false,
      currently_creating_pr: false,
      currently_fetching_org_config_names: false,
      github_users: [],
      status: 'Merged',
      available_task_org_config_names: [],
    },
  ],
  projectSlug: 'my-project',
};
