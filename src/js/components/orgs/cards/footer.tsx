import Button from '@salesforce/design-system-react/components/button';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ExternalLink } from '@/js/components/utils';
import { Org } from '@/js/store/orgs/reducer';

const Footer = ({
  org,
  ownedByCurrentUser,
  isCreating,
  isDeleting,
  isRefreshingChanges,
  isReassigningOrg,
  isRefreshingOrg,
  testOrgOutOfDate,
  readyForReview,
  openRefreshOrgModal,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isRefreshingChanges: boolean;
  isReassigningOrg?: boolean;
  isRefreshingOrg?: boolean;
  testOrgOutOfDate?: boolean;
  readyForReview?: boolean;
  openRefreshOrgModal?: () => void;
}) => {
  const { t } = useTranslation();

  const asStatus = function (block: JSX.Element): JSX.Element {
    return <div role="status">{block}</div>;
  };

  const loadingMsg: JSX.Element = t(
    'This process could take a number of minutes. Feel free to leave this page and check back later.',
  );

  if (isCreating || isRefreshingOrg) {
    return asStatus(loadingMsg);
  }
  if (isDeleting) {
    return asStatus(t('Deleting Org…'));
  }
  if (isRefreshingChanges) {
    return asStatus(t('Checking for Unretrieved Changes…'));
  }
  if (isReassigningOrg) {
    return asStatus(t('Reassigning Org Ownership…'));
  }
  if (org && ownedByCurrentUser) {
    if (org.currently_retrieving_metadata) {
      return asStatus(
        <>
          {t('Retrieving Selected Changes…')}
          <div className="slds-p-top_small">{loadingMsg}</div>
        </>,
      );
    }
    if (org.currently_retrieving_dataset) {
      return asStatus(
        <>
          {t('Retrieving Selected Dataset…')}
          <div className="slds-p-top_small">{loadingMsg}</div>
        </>,
      );
    }
    if (org.currently_retrieving_omnistudio) {
      return (
        <>
          {t('Retrieving Selected OmniStudio Configuration…')}
          <div className="slds-p-top_small">{loadingMsg}</div>
        </>
      );
    }
    const orgUrl = window.api_urls.scratch_org_redirect(org.id);
    /* istanbul ignore else */
    if (orgUrl) {
      if (testOrgOutOfDate) {
        return (
          <Button
            label={t('View Org')}
            variant="link"
            onClick={openRefreshOrgModal}
          />
        );
      }
      const label = readyForReview ? t('Test Changes in Org') : t('View Org');
      return <ExternalLink url={orgUrl}>{label}</ExternalLink>;
    }
  }

  return null;
};

export default Footer;
