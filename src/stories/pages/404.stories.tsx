import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import FourOhFour from '@/js/components/404';

export default {
  title: 'Pages/404/Examples',
  component: FourOhFour,
};

const Template: Story<ComponentProps<typeof FourOhFour>> = (args) => (
  <FourOhFour {...args} />
);

export const Default404 = Template.bind({});
Default404.argTypes = {
  message: { control: 'text' },
};
Default404.storyName = 'Default';

export const Custom404 = Template.bind({});
Custom404.args = {
  message: (
    <>
      We can’t find the epic you’re looking for. Try another epic from{' '}
      <a href="#">this project</a>.
    </>
  ),
};
Custom404.argTypes = {
  message: { control: { disable: true } },
};
Custom404.storyName = 'Custom Message';
