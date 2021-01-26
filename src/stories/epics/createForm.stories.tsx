import { Story } from '@storybook/react/types-6-0';
import { sample } from 'lodash';
import React, { ComponentProps } from 'react';

import CreateEpicModalComponent from '~js/components/epics/createForm';

import { withRedux } from '../decorators';
import { sampleEpic1, sampleGitHubUser1 } from '../fixtures';

export default {
  title: 'Epics/CreateEpic/Component',
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
  project: {
    name: sampleEpic1.name,
    id: sampleEpic1.id,
    description: sampleEpic1.description,
    github_users: [sampleGitHubUser1],
    slug: sampleEpic1.slug,
    old_slugs: sampleEpic1.old_slugs,
  },
};

/*  user,
  project,
  isOpen,
  closeCreateModal,
  history, */
