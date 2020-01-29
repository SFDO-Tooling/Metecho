import i18n from 'i18next';
import React from 'react';

import { ExternalLink } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';

const Footer = ({
  org,
  ownedByCurrentUser,
  isCreating,
  isDeleting,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isCreating: boolean;
  isDeleting: boolean;
}) => {
  const loadingMsg = i18n.t(
    'This process could take a number of minutes. Feel free to leave this page and check back later.',
  );

  if (isCreating) {
    return <>{loadingMsg}</>;
  }
  if (org) {
    if (isDeleting) {
      return <>{i18n.t('Deleting Org…')}</>;
    }
    if (ownedByCurrentUser) {
      if (org.currently_capturing_changes) {
        return (
          <>
            {i18n.t('Capturing Selected Changes…')}
            <div className="slds-p-top_small">{loadingMsg}</div>
          </>
        );
      }
      if (org.currently_refreshing_changes) {
        return <>{i18n.t('Checking for Uncaptured Changes…')}</>;
      }
      const orgUrl = window.api_urls.scratch_org_redirect(org.id);
      /* istanbul ignore else */
      if (orgUrl) {
        return <ExternalLink url={orgUrl}>{i18n.t('View Org')}</ExternalLink>;
      }
    }
  }

  return null;
};

export default Footer;
