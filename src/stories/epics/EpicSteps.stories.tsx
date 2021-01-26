import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import EpicStatusSteps from '~js/components/epics/steps';

import {
  sampleEpic1,
  sampleEpic2,
  sampleEpic3,
  sampleTask1,
} from '../fixtures';

export default {
  title: 'Epics/Steps/Component',
  component: EpicStatusSteps,
  description: 'something here',
};

const Template: Story<ComponentProps<typeof EpicStatusSteps>> = (args) => (
  <EpicStatusSteps {...args} />
);

export const EpicStepsInitial = Template.bind({});
EpicStepsInitial.args = {
  epic: sampleEpic1,
  tasks: [],
  readyToSubmit: false,
  currentlySubmitting: false,
  handleAction: action('handleStepAction'),
};
EpicStepsInitial.storyName = 'Initial';

export const EpicStepsReadyToSubmit = Template.bind({});
EpicStepsReadyToSubmit.args = {
  epic: { ...sampleEpic3, has_unmerged_commits: true },
  tasks: [sampleTask1],
  readyToSubmit: true,
  currentlySubmitting: false,
  handleAction: action('handleStepAction'),
};
EpicStepsReadyToSubmit.storyName = 'Ready to Submit';

export const EpicStepsReadyToMerge = Template.bind({});

EpicStepsReadyToMerge.args = {
  epic: sampleEpic2,
  tasks: [sampleTask1],
  readyToSubmit: true,
  currentlySubmitting: false,
  handleAction: action('handleStepAction'),
};
EpicStepsReadyToMerge.storyName = 'Ready to Merge';
