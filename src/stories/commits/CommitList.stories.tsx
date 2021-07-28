import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import CommitListComponent from '@/js/components/commits/list';

import { withRedux } from '../decorators';
import { sampleCommit1, sampleCommit2 } from '../fixtures';

export default {
  title: 'Commits/List/Example',
  component: CommitListComponent,
  decorators: [withRedux()],
};

const Template: Story<ComponentProps<typeof CommitListComponent>> = (args) => (
  <CommitListComponent {...args} />
);

export const CommitList = Template.bind({});
CommitList.args = {
  commits: [sampleCommit1, sampleCommit2],
};
CommitList.argTypes = {
  commits: { control: { disable: true } },
};
CommitList.storyName = 'Example';
