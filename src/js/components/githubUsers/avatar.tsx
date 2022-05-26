import Avatar from '@salesforce/design-system-react/components/avatar';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { GitHubOrg, GitHubUser } from '@/js/store/user/reducer';

const GitHubUserAvatar = ({
  user,
  org,
  size,
}: {
  user?: GitHubUser;
  org?: GitHubOrg;
  size?: 'small' | 'x-small' | 'medium' | 'large';
}) => {
  const { t } = useTranslation();

  if (user) {
    return (
      <Avatar
        variant="user"
        imgAlt={t('avatar for user {{username}}', { username: user.login })}
        imgSrc={user.avatar_url}
        title={user.login}
        size={size || 'small'}
      />
    );
  }

  /* istanbul ignore else */
  if (org) {
    return (
      <Avatar
        variant="entity"
        imgAlt={t('avatar for org {{name}}', { name: org.name })}
        imgSrc={org.avatar_url}
        title={org.name}
        size={size || 'small'}
      />
    );
  }

  /* istanbul ignore next */
  return null;
};

export default GitHubUserAvatar;
