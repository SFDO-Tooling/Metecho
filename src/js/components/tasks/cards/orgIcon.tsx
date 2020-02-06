import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React from 'react';

import { ExternalLink } from '@/components/utils';

const OrgIcon = ({
  orgId,
  ownedByCurrentUser,
  isDeleting,
  isRefreshingOrg,
  reviewOrgOutOfDate,
  openRefreshOrgModal,
}: {
  orgId: string;
  ownedByCurrentUser: boolean;
  isDeleting: boolean;
  isRefreshingOrg: boolean;
  reviewOrgOutOfDate: boolean;
  openRefreshOrgModal: () => void;
}) => {
  const orgUrl = window.api_urls.scratch_org_redirect(orgId);

  if (orgUrl && ownedByCurrentUser && !isDeleting && !isRefreshingOrg) {
    const iconLink = (
      <Icon
        category="utility"
        name="link"
        size="x-small"
        className="icon-link slds-m-bottom_xxx-small"
      />
    );
    return reviewOrgOutOfDate ? (
      <Button
        label={iconLink}
        variant="link"
        title={i18n.t('View Org')}
        assistiveText={{ icon: i18n.t('View Org') }}
        onClick={openRefreshOrgModal}
      />
    ) : (
      <ExternalLink url={orgUrl} title={i18n.t('View Org')}>
        {iconLink}
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
