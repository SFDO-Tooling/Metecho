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

  const loadingMsg: JSX.Element = t(
    'This process could take a number of minutes. Feel free to leave this page and check back later.',
  );

  if (isCreating || isRefreshingOrg) {
    return (
      <>
        <div role="status">{loadingMsg}</div>;
      </>
    );
  }
  if (isDeleting) {
    return t('Deleting Org…') as JSX.Element;
  }
  if (isRefreshingChanges) {
    return t('Checking for Unretrieved Changes…') as JSX.Element;
  }
  if (isReassigningOrg) {
    return t('Reassigning Org Ownership…') as JSX.Element;
  }
  if (org && ownedByCurrentUser) {
    if (org.currently_retrieving_metadata) {
      return (
        <>
          {t('Retrieving Selected Changes…')}
          <div className="slds-p-top_small" role="status">
            {loadingMsg}
          </div>
        </>
      );
    }
    if (org.currently_retrieving_dataset) {
      return (
        <>
          {t('Retrieving Selected Dataset…')}
          <div className="slds-p-top_small" role="status">
            {loadingMsg}
          </div>
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
