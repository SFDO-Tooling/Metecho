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

const Message404 = () => (
  <>
    We can’t find the epic you’re looking for. Try another epic from{' '}
    <a href="#">this project</a>.
  </>
);
export const FourOhFour = Template.bind({});
FourOhFour.args = {
  message: <Message404 />,
};
FourOhFour.storyName = '404 (custom text)';

export const EmptyFourOhFour = Template.bind({});
EmptyFourOhFour.parameters = {
  controls: { hideNoControlsWarning: true },
};
EmptyFourOhFour.storyName = '404 (default text)';
