import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import EpicTableComponent from '@/js/components/epics/table';
import { Epic } from '@/js/store/epics/reducer';

import { withRedux } from '../../decorators';
import {
  sampleEpic1,
  sampleEpic2,
  sampleEpic3,
  sampleEpic4,
  sampleEpic5,
  sampleUser1,
} from '../../fixtures';

export default {
  title: 'Epics/Table/Example',
  component: EpicTableComponent,
  decorators: [withRedux({ user: sampleUser1 })],
};

const sampleEpics: { [key: string]: Epic } = {
  'Planned with branch': sampleEpic1,
  'In Progress': sampleEpic2,
  Planned: sampleEpic3,
  Merged: sampleEpic4,
  Review: sampleEpic5,
};

type Props = ComponentProps<typeof EpicTableComponent>;

interface StoryProps extends Omit<Props, 'epics'> {
  epics: string[];
}

const Template = ({ epics, ...rest }: StoryProps) => (
  <EpicTableComponent epics={epics.map((opt) => sampleEpics[opt])} {...rest} />
);

export const EpicTable: Story<StoryProps> = Template.bind({});
EpicTable.args = {
  epics: Object.keys(sampleEpics),
  isFetched: true,
  userHasPermissions: true,
  projectSlug: 'my-project',
};
EpicTable.argTypes = {
  epics: {
    options: Object.keys(sampleEpics),
    control: {
      type: 'multi-select',
    },
  },
};
EpicTable.storyName = 'Example';
