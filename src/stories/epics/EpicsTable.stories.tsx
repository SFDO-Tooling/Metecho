import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import EpicsTableComponent from '~js/components/epics/table';

import {
  sampleEpic1,
  sampleEpic2,
  sampleEpic3,
  sampleEpic4,
} from '../fixtures';

export default {
  title: 'Epics/Table/Component',
  component: EpicsTableComponent,
};

const Template: Story<ComponentProps<typeof EpicsTableComponent>> = (args) => (
  <EpicsTableComponent {...args} />
);

export const Component = Template.bind({});
Component.args = {
  epics: [sampleEpic1, sampleEpic2, sampleEpic3, sampleEpic4],
  projectSlug: 'my-project',
};
