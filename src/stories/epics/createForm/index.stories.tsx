import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import CreateEpicModal from '@/js/components/epics/createForm';

import { withRedux } from '../../decorators';
import { sampleProject1, sampleUser1 } from '../../fixtures';

export default {
  title: 'Epics/CreateForm/Example',
  component: CreateEpicModal,
  decorators: [withRedux()],
};

const Template: Story<ComponentProps<typeof CreateEpicModal>> = (args) => (
  <CreateEpicModal {...args} />
);

export const CreateForm = Template.bind({});
CreateForm.args = {
  user: sampleUser1,
  project: sampleProject1,
  isOpen: true,
  closeCreateModal: action('closeCreateModal'),
};
CreateForm.argTypes = {
  user: { control: { disable: true } },
  project: { control: { disable: true } },
};
CreateForm.storyName = 'Example';
