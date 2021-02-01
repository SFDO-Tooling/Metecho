import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import CreateEpicModalComponent from '~js/components/epics/createForm';

import { withRedux } from '../decorators';
import { sampleProject1, sampleUser1 } from '../fixtures';

export default {
  title: 'Epics/CreateEpicModal/Example',
  component: CreateEpicModalComponent,
  decorators: [withRedux()],
};

const Template: Story<ComponentProps<typeof CreateEpicModalComponent>> = (
  args,
) => <CreateEpicModalComponent {...args} />;

export const CreateEpicModal = Template.bind({});
CreateEpicModal.args = {
  user: sampleUser1,
  project: sampleProject1,
  isOpen: true,
  closeCreateModal: action('closeCreateModal'),
};
CreateEpicModal.argTypes = {
  user: { control: { disable: true } },
  project: { control: { disable: true } },
};
CreateEpicModal.storyName = 'Example';
