import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import Steps from '~js/components/steps';

import { sampleSteps } from '../fixtures';

export default {
  title: 'Components/Steps/Component',
  component: Steps,
};

const Template: Story<ComponentProps<typeof Steps>> = (args) => (
  <Steps {...args} />
);

export const StepsInitial = Template.bind({});
StepsInitial.args = {
  steps: sampleSteps,
  title: 'Steps for Development',
  handleAction: action('handleAction'),
};
StepsInitial.storyName = 'Initial';
