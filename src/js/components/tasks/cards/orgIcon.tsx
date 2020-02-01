import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React from 'react';

import { ExternalLink } from '@/components/utils';

const OrgIcon = ({
  orgId,
  ownedByCurrentUser,
  isDeleting,
}: {
  orgId: string;
  ownedByCurrentUser: boolean;
  isDeleting: boolean;
}) => {
  const orgUrl = window.api_urls.scratch_org_redirect(orgId);

  if (orgUrl && ownedByCurrentUser && !isDeleting) {
    return (
      <ExternalLink url={orgUrl} title={i18n.t('View Org')}>
        <Icon
          category="utility"
          name="link"
          size="x-small"
          className="icon-link slds-m-bottom_xxx-small"
        />
      </ExternalLink>
    );
  }

  return (
    <Icon
      category="utility"
      name="link"
      size="x-small"
      className="slds-m-bottom_xxx-small"
    />
  );
};

export default OrgIcon;
