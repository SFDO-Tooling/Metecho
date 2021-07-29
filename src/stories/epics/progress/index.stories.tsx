import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import EpicProgressComponent from '@/js/components/epics/progress';

import { withRedux } from '../../decorators';

export default {
  title: 'Epics/Progress/Example',
  component: EpicProgressComponent,
  decorators: [withRedux()],
};

const Template: Story<ComponentProps<typeof EpicProgressComponent>> = (
  args,
) => <EpicProgressComponent {...args} />;

export const EpicProgress = Template.bind({});
EpicProgress.args = {
  range: [1, 10],
};

export const EpicProgressComplete = Template.bind({});
EpicProgressComplete.args = {
  range: [10, 10],
};
