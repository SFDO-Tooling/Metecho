import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import React from 'react';

import { ExternalLink } from '@/components/utils';

// number of commits behind
// refresh org action (which doesnt exist)
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
    heading={`QA Behind Latet: ${delinquentCommits} Commits`}
  >
    <div className="slds-form slds-p-around_large">
      <div className="slds-grid slds-wrap slds-gutters">
        <div
          className="slds-col
              slds-size_1-of-1
              slds-p-bottom_medium"
        >
          <p className="slds-p-vertical_medium slds-is-relative">
            <b>Recommended</b> - This option will recreate your Org with the new
            changes, allowing you to review the most recent version.
          </p>
          <Button variant="brand" className="slds-size_full hide-separator">
            Refresh QA Org
          </Button>
          <p className="slds-p-vertical_medium slds-is-relative">
            You may proceed with the outdated org, but be aware that you will
            not be reviewing the current version
          </p>
          <ExternalLink url={orgUrl}>
            {' '}
            <Button
              variant="outline-brand"
              className="slds-size_full hide-separator"
            >
              Proceed to Outdated Org
            </Button>
          </ExternalLink>
        </div>
      </div>
    </div>
  </Modal>
);

export default RefreshOrgModal;
