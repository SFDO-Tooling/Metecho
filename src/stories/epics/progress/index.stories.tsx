import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import EpicProgressComponent from '~js/components/epics/progress';

export default {
  title: 'Epics/Progress/Example',
  component: EpicProgressComponent,
};

const Template: Story<ComponentProps<typeof EpicProgressComponent>> = (
  args,
) => <EpicProgressComponent {...args} />;

export const EpicProgress = Template.bind({});
EpicProgress.args = {
  range: [1, 10],
};
