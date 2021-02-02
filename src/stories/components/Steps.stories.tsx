import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';
import { Step } from 'src/js/components/steps/stepsItem';

import Steps from '~js/components/steps';

import { initialSteps, step2 } from '../fixtures';

export default {
  title: 'Components/Steps/Example',
  component: Steps,
};

const sampleSteps: { [key: string]: Step } = {
  Initial: initialSteps,
  Step2: step2,
};
type Props = ComponentProps<typeof Steps>;

interface StoryProps extends Omit<Props, 'steps'> {
  steps: string[];
}

const Template = ({ steps, ...rest }: StoryProps) => {
  console.log(steps.map((o) => sampleSteps[o]));
  return <Steps steps={steps.map((opt) => sampleSteps[opt])} {...rest} />;
};

export const EpicSteps: Story<StoryProps> = Template.bind({});
EpicSteps.args = {
  title: 'Steps for Development',
  handleAction: action('handleAction'),
};
EpicSteps.argTypes = {
  steps: {
    defaultValue: Object.keys(sampleSteps),
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
