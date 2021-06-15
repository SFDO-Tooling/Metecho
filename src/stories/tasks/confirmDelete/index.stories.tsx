import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import ConfirmDeleteModal from '~js/components/tasks/confirmDeleteModal';
import { CONFIRM_ORG_TRACKER } from '~js/utils/constants';

export default {
  title: 'Tasks/ConfirmDelete/Examples',
  component: ConfirmDeleteModal,
};

const Template: Story<ComponentProps<typeof ConfirmDeleteModal>> = (args) => (
  <ConfirmDeleteModal {...args} />
);

export const ConfirmDelete = Template.bind({});

ConfirmDelete.args = {
  org: null,
  isOpen: true,
  actionType: CONFIRM_ORG_TRACKER.DELETE,
  handleClose: action('handleClose'),
  handleCancel: action('handleCancel'),
};
ConfirmDelete.argTypes = {
  org: { control: { disable: true } },
  isOpen: { control: { disable: true } },
  actiontype: { control: { disable: true } },
};

ConfirmDelete.storyName = 'Delete';

export const ConfirmRefresh = Template.bind({});

ConfirmRefresh.args = {
  org: null,
  isOpen: true,
  actionType: CONFIRM_ORG_TRACKER.REFRESH,
  handleClose: action('handleClose'),
  handleCancel: action('handleCancel'),
};
ConfirmRefresh.argTypes = {
  org: { control: { disable: true } },
  isOpen: { control: { disable: true } },
};
ConfirmRefresh.storyName = 'Refresh';
