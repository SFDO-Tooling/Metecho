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
      branch_name: 'my-epic',
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
  ],
  projectSlug: 'my-project',
};
