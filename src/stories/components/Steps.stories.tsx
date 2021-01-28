import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import Steps from '~js/components/steps';

import {
  sampleSteps,
  sampleEpic2,
  sampleEpic3,
  sampleTask1,
} from '../fixtures';

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
  title: '',
  handleAction: action('handleAction'),
};
StepsInitial.storyName = 'Initial';

// export const EpicStepsReadyToSubmit = Template.bind({});
// EpicStepsReadyToSubmit.args = {
//   epic: { ...sampleEpic3, has_unmerged_commits: true },
//   tasks: [sampleTask1],
//   readyToSubmit: true,
//   currentlySubmitting: false,
//   handleAction: action('handleStepAction'),
// };
// EpicStepsReadyToSubmit.storyName = 'Ready to Submit';

// export const EpicStepsReadyToMerge = Template.bind({});

// EpicStepsReadyToMerge.args = {
//   epic: sampleEpic2,
//   tasks: [sampleTask1],
//   readyToSubmit: true,
//   currentlySubmitting: false,
//   handleAction: action('handleStepAction'),
// };
// EpicStepsReadyToMerge.storyName = 'Ready to Merge';
