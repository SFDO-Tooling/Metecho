import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import CommitListComponent from '~js/components/commits/list';

import { sampleCommit1, sampleCommit2 } from '../fixtures';

export default {
  title: 'Commits/List/Component',
  component: CommitListComponent,
};

const Template: Story<ComponentProps<typeof CommitListComponent>> = (args) => (
  <CommitListComponent {...args} />
);

export const Component = Template.bind({});
Component.args = {
  commits: [sampleCommit1, sampleCommit2],
};
