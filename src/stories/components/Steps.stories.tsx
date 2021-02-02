import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';
import { Step } from 'src/js/components/steps/stepsItem';

import Steps from '~js/components/steps';

import { sampleSteps1, sampleSteps2 } from '../fixtures';

export default {
  title: 'Components/Steps/Example',
  component: Steps,
};

const sampleSteps: { [key: string]: Step[] } = {
  'Sample steps': sampleSteps1,
  'Different sample steps': sampleSteps2,
};

type Props = ComponentProps<typeof Steps>;

interface StoryProps extends Omit<Props, 'steps'> {
  steps: string;
}

const Template = ({ steps, ...rest }: StoryProps) => (
  <Steps steps={sampleSteps[steps]} {...rest} />
);

export const EpicSteps: Story<StoryProps> = Template.bind({});
EpicSteps.args = {
  title: 'Steps for Development',
  handleAction: action('handleAction'),
};
EpicSteps.argTypes = {
  steps: {
    defaultValue: 'Sample steps',
    control: {
      type: 'select',
      options: Object.keys(sampleSteps),
    },
  },
};
EpicSteps.storyName = 'Epic Steps';

// export const TaskSteps = Template.bind({});
// TaskSteps.args = {
//   steps: initialSteps,
//   title: 'Steps for Development',
//   handleAction: action('handleAction'),
// };
// TaskSteps.storyName = 'Task Steps';
