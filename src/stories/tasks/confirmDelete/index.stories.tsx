import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

 import {  ConfirmOrgTracker,CONFIRM_ORG_TRACKER, ORG_TYPES } from '~js/utils/constants';

import ConfirmDeleteModal from '~js/components/tasks/confirmDeleteModal';

export default {
  title: 'Tasks/ConfirmDelete/Example',
  component: ConfirmDeleteModal,
};

const actionTypes: { [key: string]: ConfirmOrgTracker } = {
  'Delete': 'delete',
  'Refresh': 'refresh',
}

const Template: Story<ComponentProps<typeof ConfirmDeleteModal>> = (args) => (
  <ConfirmDeleteModal {...args} />
);

export const ConfirmDelete = Template.bind({});

ConfirmDelete.args = {
  org: null,
  isOpen: true,
  actionType: 'delete',
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
    }
  }

};

ConfirmDelete.storyName = 'Example';
