import Avatar from '@salesforce/design-system-react/components/avatar';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { GitHubUser } from '@/js/store/user/reducer';

const GitHubUserAvatar = ({
  user,
  size,
}: {
  user: GitHubUser;
  size?: 'small' | 'x-small' | 'medium' | 'large';
}) => {
  const { t } = useTranslation();

  return (
    <Avatar
      variant="user"
      imgAlt={t('avatar for user {{username}}', { username: user.login })}
      imgSrc={user.avatar_url}
      title={user.login}
      size={size || 'small'}
    />
  );
};

export default GitHubUserAvatar;
