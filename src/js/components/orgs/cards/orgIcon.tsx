import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ExternalLink } from '@/js/components/utils';

const OrgIcon = ({
  orgId,
  ownedByCurrentUser,
  isDeleting,
  isRefreshingOrg,
  testOrgOutOfDate,
  openRefreshOrgModal,
}: {
  orgId: string;
  ownedByCurrentUser: boolean;
  isDeleting: boolean;
  isRefreshingOrg?: boolean;
  testOrgOutOfDate?: boolean;
  openRefreshOrgModal?: () => void;
}) => {
  const { t } = useTranslation();
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
    return testOrgOutOfDate ? (
      <Button
        label={iconLink}
        variant="link"
        title={t('View Org')}
        assistiveText={{ icon: t('View Org') }}
        onClick={openRefreshOrgModal}
      />
    ) : (
      <ExternalLink url={orgUrl} title={t('View Org')}>
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
