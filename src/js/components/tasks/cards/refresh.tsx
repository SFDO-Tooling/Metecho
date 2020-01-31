import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import { ExternalLink } from '@/components/utils';

// todo @refresh org action
const RefreshOrgModal = ({
  delinquentCommits,
  orgUrl,
  refreshOrgModalOpen,
  closeRefreshOrgModal,
}: {
  delinquentCommits: number;
  orgUrl: string;
  refreshOrgModalOpen: boolean;
  closeRefreshOrgModal: () => void;
}) => (
  <Modal
    isOpen={refreshOrgModalOpen}
    onRequestClose={closeRefreshOrgModal}
    heading={`QA Behind Latest: ${delinquentCommits} Commits`}
  >
    <div className="slds-form slds-p-around_large">
      <div className="slds-grid slds-wrap slds-gutters">
        <div
          className="slds-col
              slds-size_1-of-1
              slds-p-bottom_medium"
        >
          <Trans i18nKey="refreshQaOrg">
            <b>Recommended</b> - This option will recreate your Org with the new
            changes, allowing you to review the most recent version.
          </Trans>
          <Button
            variant="brand"
            className="slds-size_full slds-m-vertical_medium"
          >
            {i18n.t('Refresh QA Org')}
          </Button>
          <Trans i18nKey="viewOutdatedQaOrg">
            You may proceed with the outdated org, but be aware that you will
            not be reviewing the current version
          </Trans>
          <ExternalLink url={orgUrl}>
            {' '}
            <Button
              variant="outline-brand"
              className="slds-size_full slds-m-top_medium"
            >
              {i18n.t('Proceed to Outdated Org')}
            </Button>
          </ExternalLink>
        </div>
      </div>
    </div>
  </Modal>
);

export default RefreshOrgModal;
