import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import ConfirmRemoveUserModal from '~js/components/tasks/confirmRemoveUserModal';
import { withRedux } from '../../decorators';

import { ORG_TYPES } from '~js/utils/constants';
import { sampleUser1 } from '../../fixtures';

export default {
  title: 'Tasks/ConfirmRemove/Example',
  component: ConfirmRemoveUserModal,
  decorators: [withRedux()],
};

const Template: Story<ComponentProps<typeof ConfirmRemoveUserModal>> = (
  args,
) => <ConfirmRemoveUserModal {...args} />;

export const ConfirmRemove = Template.bind({});
ConfirmRemove.args = {
  isOpen: true,
  waitingToRemoveUser: {
    type: ORG_TYPES.DEV,
    assignee: null,
    shouldAlertAssignee: false,
  },
  handleClose: action('handleClose'),
  handleCancel: action('handleCancel'),
  handleAssignUser: action('handleAssignUser')
};

ConfirmRemove.storyName = 'Example';
