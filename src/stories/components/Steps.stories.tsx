import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';
import { Step } from 'src/js/components/steps/stepsItem';

import Steps from '~js/components/steps';

import {
  epicSteps1,
  epicSteps2,
  epicSteps3,
  taskSteps1,
  taskSteps2,
} from '../fixtures';

export default {
  title: 'Components/Steps/Example',
  component: Steps,
};

const epicSteps: { [key: string]: Step[] } = {
  'Initial steps': epicSteps1,
  'Steps with action': epicSteps2,
  'Steps with link': epicSteps3,
};

const taskSteps: { [key: string]: Step[] } = {
  'New Task': taskSteps1,
  'With assignee': taskSteps2,
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
  title: 'Steps for this Epic',
  handleAction: action('handleAction'),
};
EpicSteps.argTypes = {
  steps: {
    defaultValue: 'Initial steps',
    control: {
      type: 'select',
      options: Object.keys(epicSteps),
    },
  },
};
EpicSteps.storyName = 'Epic Steps';

const TaskTemplate = ({ steps, ...rest }: StoryProps) => (
  <Steps steps={taskSteps[steps]} {...rest} />
);
export const TaskSteps: Story<StoryProps> = TaskTemplate.bind({});
TaskSteps.args = {
  title: 'Steps for this Task',
  handleAction: action('handleAction'),
};
TaskSteps.argTypes = {
  steps: {
    defaultValue: 'New Task',
    control: {
      type: 'select',
      options: Object.keys(taskSteps),
    },
  },
};
TaskSteps.storyName = 'Task Steps';
