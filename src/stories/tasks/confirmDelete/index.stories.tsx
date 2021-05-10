import React, { ComponentProps } from 'react';
import { Story } from '@storybook/react/types-6-0';
import { action } from '@storybook/addon-actions';

import { Org } from '~js/store/orgs/reducer';
import ConfirmDeleteModal from '~js/components/tasks/confirmDeleteModal'


export default {
  title: 'Tasks/ConfirmDelete/Example',
  component: ConfirmDeleteModal,
};

const Template: Story<ComponentProps<typeof ConfirmDeleteModal>> = (
  args,
  ) => <ConfirmDeleteModal {...args} />


export const ConfirmDelete = Template.bind({});

ConfirmDelete.args = {
  org: null,
  isOpen: true,
  handleClose: action('handleClose'),
  handleCancel: action('handleCancel'),
};
ConfirmDelete.argTypes = {
  org: { control: { disable: true } },
  isOpen: { control: { disable: true } },
}

ConfirmDelete.storyName = 'Example';
