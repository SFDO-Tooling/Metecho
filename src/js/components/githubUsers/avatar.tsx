import Avatar from '@salesforce/design-system-react/components/avatar';
import i18n from 'i18next';
import React from 'react';

import { GitHubUser } from '@/js/store/user/reducer';

const GitHubUserAvatar = ({
  user,
  size,
}: {
  user: GitHubUser;
  size?: 'small' | 'x-small' | 'medium' | 'large';
}) => (
  <Avatar
    variant="user"
    imgAlt={i18n.t('avatar for user {{username}}', { username: user.login })}
    imgSrc={user.avatar_url}
    title={user.login}
    size={size || 'small'}
  />
);

export default GitHubUserAvatar;
