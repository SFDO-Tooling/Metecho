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
  title: 'Pages/Epics/Table/Component',
  component: EpicsTableComponent,
  description: 'something here',
};

const Template: Story<ComponentProps<typeof EpicsTableComponent>> = (args) => (
  <EpicsTableComponent {...args} />
);

export const EpicsTable = Template.bind({});
EpicsTable.args = {
  epics: [sampleEpic1, sampleEpic2, sampleEpic3, sampleEpic4],
  projectSlug: 'my-project',
};