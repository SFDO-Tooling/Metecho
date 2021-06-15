import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import ConfirmDeleteModal from '~js/components/tasks/confirmDeleteModal';
import { ConfirmOrgTracker, CONFIRM_ORG_TRACKER } from '~js/utils/constants';

export default {
  title: 'Tasks/ConfirmDelete/Example',
  component: ConfirmDeleteModal,
};

const actionTypes: { [key: string]: ConfirmOrgTracker } = {
  Delete: CONFIRM_ORG_TRACKER.DELETE,
  Refresh: CONFIRM_ORG_TRACKER.REFRESH,
};

const Template: Story<ComponentProps<typeof ConfirmDeleteModal>> = (args) => (
  <ConfirmDeleteModal {...args} />
);

export const ConfirmDelete = Template.bind({});

ConfirmDelete.args = {
  org: null,
  isOpen: true,
  actionType: 'refresh',
  handleClose: action('handleClose'),
  handleCancel: action('handleCancel'),
};
ConfirmDelete.argTypes = {
  org: { control: { disable: true } },
  isOpen: { control: { disable: true } },
  actiontype: {
    options: Object.keys(actionTypes),
    control: {
      type: 'select',
    },
  },
};

ConfirmDelete.storyName = 'Example';
