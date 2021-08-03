import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import ConfirmRemoveUserModal from '@/js/components/tasks/confirmRemoveUserModal';
import { ORG_TYPES } from '@/js/utils/constants';

import { sampleUser1 } from '../../fixtures';

export default {
  title: 'Tasks/ConfirmRemoveUser/Examples',
  component: ConfirmRemoveUserModal,
};

const Template: Story<ComponentProps<typeof ConfirmRemoveUserModal>> = (
  args,
) => <ConfirmRemoveUserModal {...args} />;

export const ConfirmRemoveUser = Template.bind({});

ConfirmRemoveUser.args = {
  isOpen: true,
  waitingToRemoveUser: {
    type: ORG_TYPES.DEV,
    assignee: null,
    shouldAlertAssignee: false,
  },
  handleClose: action('handleClose'),
  handleCancel: action('handleCancel'),
  handleAssignUser: action('handleAssignUser'),
};
ConfirmRemoveUser.argTypes = {
  waitingToRemoveUser: { control: { disable: true } },
};
ConfirmRemoveUser.storyName = 'Remove';

export const ConfirmChangeUser = Template.bind({});

ConfirmChangeUser.args = {
  isOpen: true,
  waitingToRemoveUser: {
    type: ORG_TYPES.DEV,
    assignee: sampleUser1.id,
    shouldAlertAssignee: false,
  },
  handleClose: action('handleClose'),
  handleCancel: action('handleCancel'),
  handleAssignUser: action('handleAssignUser'),
};
ConfirmChangeUser.argTypes = {
  waitingToRemoveUser: { control: { disable: true } },
};
ConfirmChangeUser.storyName = 'Change';
