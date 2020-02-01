import i18n from 'i18next';
import React from 'react';

import { ExternalLink } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';

const Footer = ({
  org,
  ownedByCurrentUser,
  isCreating,
  isDeleting,
  isRefreshing,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isRefreshing: boolean;
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
  if (isRefreshing) {
    return <>{i18n.t('Checking for Uncaptured Changes…')}</>;
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
      return <ExternalLink url={orgUrl}>{i18n.t('View Org')}</ExternalLink>;
    }
  }

  return null;
};

export default Footer;
