import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import CommitListComponent from '~js/components/commits/list';

import { sampleCommit1, sampleCommit2 } from '../fixtures';

export default {
  title: 'Pages/CommitList/Component',
  component: CommitListComponent,
};

const Template: Story<ComponentProps<typeof CommitListComponent>> = (args) => (
  <CommitListComponent {...args} />
);

export const CommitList = Template.bind({});
CommitList.args = {
  commits: [sampleCommit1, sampleCommit2],
};
