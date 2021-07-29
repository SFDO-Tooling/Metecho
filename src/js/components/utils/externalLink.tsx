import Icon from '@salesforce/design-system-react/components/icon';
import React, { ReactNode } from 'react';

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
}) => (
  <a href={url} target="_blank" rel="noreferrer noopener" {...props}>
    {showGitHubIcon && (
      <Icon
        path={`${githubIcon}#github`}
        size="xx-small"
        className="icon-link slds-m-bottom_xx-small"
      />
    )}
    {showButtonIcon && (
      <Icon
        category="utility"
        name="new_window"
        size="xx-small"
        className="slds-button__icon slds-button__icon_left"
        containerClassName="slds-icon_container slds-current-color"
      />
    )}
    {children}
  </a>
);

export default ExternalLink;
