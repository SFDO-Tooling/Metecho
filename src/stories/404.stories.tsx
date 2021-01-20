import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import FourOhFour from '~js/components/404';

export default {
  title: 'FourOhFour',
  component: FourOhFour,
};

const Template: Story<ComponentProps<typeof FourOhFour>> = (args) => (
  <FourOhFour {...args} />
);

export const FirstStory = Template.bind({});

FirstStory.args = {
  message: 'Lorem Ipsum',
};
