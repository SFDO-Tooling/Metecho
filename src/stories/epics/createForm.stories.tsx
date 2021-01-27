import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import CreateEpicModalComponent from '~js/components/epics/createForm';

import { withRedux } from '../decorators';
import { sampleProject1, sampleUser1 } from '../fixtures';

export default {
  title: 'Epics/CreateEpicModal/Component',
  component: CreateEpicModalComponent,
  decorators: [
    withRedux({
      user: {
        id: 'user-id',
        username: 'currentUser',
      },
    }),
  ],
};

const Template: Story<ComponentProps<typeof CreateEpicModalComponent>> = (
  args,
) => <CreateEpicModalComponent {...args} />;

export const CreateEpicModal = Template.bind({});
CreateEpicModal.args = {
  project: sampleProject1,
  user: sampleUser1,
  isOpen: true,
  closeCreateModal: action('closeCreateModal'),
};

/*  user,
  project,
  isOpen,
  closeCreateModal,
  history, */
