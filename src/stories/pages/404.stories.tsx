import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import FourOhFourComponent from '~js/components/404';

export default {
  title: 'Pages/404/Component',
  component: FourOhFourComponent,
};

const Template: Story<ComponentProps<typeof FourOhFourComponent>> = (args) => (
  <FourOhFourComponent {...args} />
);

export const FourOhFour = Template.bind({});
FourOhFour.args = {
  message: 'Lorem Ipsum',
};
