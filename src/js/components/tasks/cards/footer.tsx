import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React from 'react';

import { ExternalLink } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';
import { ORG_TYPES } from '@/utils/constants';

const Footer = ({
  org,
  ownedByCurrentUser,
  isCreating,
  isDeleting,
  isRefreshingChanges,
  reviewOrgOutOfDate,
  openRefreshOrgModal,
  isRefreshingOrg,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isRefreshingChanges: boolean;
  reviewOrgOutOfDate: boolean;
  isRefreshingOrg: boolean;
  openRefreshOrgModal: () => void;
}) => {
  const loadingMsg = i18n.t(
    'This process could take a number of minutes. Feel free to leave this page and check back later.',
  );

  if (isCreating) {
    return <>{loadingMsg}</>;
  }
  if (isDeleting) {
    return <>{i18n.t('Deleting Org…')}</>;
  }
  if (isRefreshingChanges) {
    return <>{i18n.t('Checking for Uncaptured Changes…')}</>;
  }
  if (org?.org_type === ORG_TYPES.QA && isRefreshingOrg) {
    return <>{i18n.t('Refreshing Org…')}</>;
  }
  if (org && ownedByCurrentUser) {
    if (org.currently_capturing_changes) {
      return (
        <>
          {i18n.t('Capturing Selected Changes…')}
          <div className="slds-p-top_small">{loadingMsg}</div>
        </>
      );
    }
    const orgUrl = window.api_urls.scratch_org_redirect(org.id);
    /* istanbul ignore else */
    if (orgUrl) {
      if (reviewOrgOutOfDate) {
        return (
          <Button
            label={i18n.t('View Org')}
            variant="link"
            onClick={openRefreshOrgModal}
          />
        );
      }
      return <ExternalLink url={orgUrl}>{i18n.t('View Org')}</ExternalLink>;
    }
  }

  return null;
};

export default Footer;
