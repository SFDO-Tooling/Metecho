import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import EpicTableComponent from '~js/components/epics/table';

import {
  sampleEpic1,
  sampleEpic2,
  sampleEpic3,
  sampleEpic4,
  sampleEpic5,
} from '../fixtures';

export default {
  title: 'Epics/Table/Component',
  component: EpicTableComponent,
  description: 'something here',
};

const Template: Story<ComponentProps<typeof EpicTableComponent>> = (args) => (
  <EpicTableComponent {...args} />
);

export const EpicTable = Template.bind({});
EpicTable.args = {
  epics: [sampleEpic1, sampleEpic2, sampleEpic3, sampleEpic4, sampleEpic5],
  projectSlug: 'my-project',
};
