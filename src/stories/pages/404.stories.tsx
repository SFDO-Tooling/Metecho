import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import FourOhFour from '~js/components/404';

export default {
  title: 'Pages/404/Component',
};

const Template: Story<ComponentProps<typeof FourOhFour>> = (args) => (
  <FourOhFour {...args} />
);

export const FourOFour = Template.bind({});

FourOFour.args = {
  message: 'Lorem Ipsum',
};
