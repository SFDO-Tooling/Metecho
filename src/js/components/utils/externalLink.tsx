import Icon from '@salesforce/design-system-react/components/icon';
import React, { ReactNode } from 'react';

import { GITHUB_REPO_PREFIX } from '@/utils/constants';
import githubIcon from '#/github.svg';

const ExternalLink = ({
  url,
  showButtonIcon = false,
  shortenGithub = false,
  children,
  ...props
}: {
  url: string;
  showButtonIcon?: boolean;
  shortenGithub?: boolean;
  children?: ReactNode;
  [key: string]: any;
}) => (
  <a href={url} target="_blank" rel="noreferrer noopener" {...props}>
    {shortenGithub && url.startsWith(GITHUB_REPO_PREFIX) ? (
      <>
        <Icon
          path={`${githubIcon}#github`}
          size="xx-small"
          className="icon-link slds-m-bottom_xx-small"
        />
        {url.slice(GITHUB_REPO_PREFIX.length)}
      </>
    ) : (
      <>
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
      </>
    )}
  </a>
);

export default ExternalLink;
