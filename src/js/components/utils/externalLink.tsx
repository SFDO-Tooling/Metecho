import Icon from '@salesforce/design-system-react/components/icon';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import githubIcon from '@/img/github.svg';

const ExternalLink = ({
  url,
  showButtonIcon = false,
  showGitHubIcon = false,
  children,
  ...props
}: {
  url: string;
  showButtonIcon?: boolean;
  showGitHubIcon?: boolean;
  children?: ReactNode;
  [key: string]: any;
}) => {
  const { t } = useTranslation();
  return (
    <a href={url} target="_blank" rel="noreferrer noopener" {...props}>
      {showGitHubIcon && (
        <Icon
          path={`${githubIcon}#github`}
          size="xx-small"
          className="icon-link slds-m-bottom_xx-small"
        />
      )}
      {children}
      {showButtonIcon && (
        <Icon
          category="utility"
          name="new_window"
          size="xx-small"
          className="slds-button__icon slds-button__icon_right"
          containerClassName="slds-icon_container slds-current-color"
          assistiveText={{ label: t('Opens in new tab') }}
        />
      )}
    </a>
  );
};

export default ExternalLink;
