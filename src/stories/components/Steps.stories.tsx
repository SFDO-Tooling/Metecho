import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import Steps from '@/js/components/steps';
import { Step } from '@/js/components/steps/stepsItem';

import {
  sampleEpicSteps,
  sampleEpicStepsWithAction,
  sampleEpicStepsWithLink,
  sampleTaskSteps,
  sampleTaskStepsWithAssignee,
} from '../fixtures';

export default {
  title: 'Components/Steps/Examples',
  component: Steps,
};

const epicSteps: { [key: string]: Step[] } = {
  'Initial steps': sampleEpicSteps,
  'Steps with action': sampleEpicStepsWithAction,
  'Steps with link': sampleEpicStepsWithLink,
};

const taskSteps: { [key: string]: Step[] } = {
  'Initial steps': sampleTaskSteps,
  'Steps with assignee': sampleTaskStepsWithAssignee,
};

type Props = ComponentProps<typeof Steps>;
interface StoryProps extends Omit<Props, 'steps'> {
  steps: string;
}

const EpicTemplate = ({ steps, ...rest }: StoryProps) => (
  <Steps steps={epicSteps[steps]} {...rest} />
);
export const EpicSteps: Story<StoryProps> = EpicTemplate.bind({});
EpicSteps.args = {
  steps: 'Initial steps',
  title: 'Next Steps for this Epic',
  handleAction: action('handleAction'),
};
EpicSteps.argTypes = {
  steps: {
    options: Object.keys(epicSteps),
    control: {
      type: 'select',
    },
  },
};
EpicSteps.storyName = 'Epic Steps';

const TaskTemplate = ({ steps, ...rest }: StoryProps) => (
  <Steps steps={taskSteps[steps]} {...rest} />
);
export const TaskSteps: Story<StoryProps> = TaskTemplate.bind({});
TaskSteps.args = {
  steps: 'Initial steps',
  title: 'Next Steps for this Task',
  handleAction: action('handleAction'),
};
TaskSteps.argTypes = {
  steps: {
    options: Object.keys(taskSteps),
    control: {
      type: 'select',
    },
  },
};
TaskSteps.storyName = 'Task Steps';
