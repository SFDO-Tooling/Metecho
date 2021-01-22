import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import CommitListComponent from '~js/components/commits/list';

export default {
  title: 'Pages/CommitList/Component',
  component: CommitListComponent,
};

const Template: Story<ComponentProps<typeof CommitListComponent>> = (args) => (
  <CommitListComponent {...args} />
);

export const CommitList = Template.bind({});
CommitList.args = {
  commits: [
    {
      id: '8471ad6',
      timestamp: '2019-02-01T19:47:49Z',
      message: 'fix homepage image',
      author: {
        name: 'Jack Brown',
        email: 'developer@web.com',
        username: 'adeveloper',
        avatar_url: 'https://randomuser.me/api/portraits/men/83.jpg',
      },
      url: '/',
    },
    {
      id: '8761ad6',
      timestamp: '2020-02-01T19:47:49Z',
      message: 'add color filter to header',
      author: {
        name: 'Jack Brown',
        email: 'developer@web.com',
        username: 'adeveloper',
        avatar_url: 'https://randomuser.me/api/portraits/men/83.jpg',
      },
      url: '/',
    },
  ],
};
