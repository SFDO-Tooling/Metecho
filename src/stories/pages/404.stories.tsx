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
FourOhFour.storyName = '404 (custom text)';

export const EmptyFourOhFour = Template.bind({});
EmptyFourOhFour.parameters = {
  controls: { hideNoControlsWarning: true },
};
EmptyFourOhFour.storyName = '404 (default text)';
