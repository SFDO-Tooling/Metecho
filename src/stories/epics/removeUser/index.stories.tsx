import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import ConfirmRemoveUserModal from '@/js/components/epics/confirmRemoveUserModal';

import { sampleGitHubUser1, sampleGitHubUser2 } from '../../fixtures';

export default {
  title: 'Epics/RemoveUser/Example',
  component: ConfirmRemoveUserModal,
};

const Template: Story<ComponentProps<typeof ConfirmRemoveUserModal>> = (
  args,
) => <ConfirmRemoveUserModal {...args} />;

export const RemoveUser = Template.bind({});
RemoveUser.args = {
  confirmRemoveUsers: [sampleGitHubUser1, sampleGitHubUser2],
  waitingToUpdateUsers: [sampleGitHubUser1, sampleGitHubUser2],
  handleClose: action('handleClose'),
  handleUpdateUsers: action('handleUpdateUsers'),
};
RemoveUser.argTypes = {
  confirmRemoveUsers: { control: { disable: true } },
  waitingToUpdateUsers: { control: { disable: true } },
};
RemoveUser.storyName = 'Example';
