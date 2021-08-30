import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';

import { Org } from '@/js/store/orgs/reducer';
import {
  CONFIRM_ORG_TRACKER,
  ConfirmOrgTracker,
  ORG_TYPES,
} from '@/js/utils/constants';

const ConfirmDeleteModal = ({
  org,
  isOpen,
  actionType,
  handleClose,
  handleCancel,
  handleAction,
}: {
  org: Org | null;
  isOpen: boolean;
  actionType?: ConfirmOrgTracker;
  handleClose: () => void;
  handleCancel: () => void;
  handleAction: (o: Org) => void;
}) => {
  const handleSubmit = () => {
    handleClose();
    /* istanbul ignore else */
    if (org) {
      handleAction(org);
    }
  };

  let heading, warning, label, type;
  /* istanbul ignore if */
  if (org?.org_type === ORG_TYPES.QA) {
    type = i18n.t('Test Org');
  } else if (org?.org_type === 'Dev') {
    type = i18n.t('Dev Org');
  } else {
    type = i18n.t('Scratch Org');
  }
  if (actionType === CONFIRM_ORG_TRACKER.REFRESH) {
    heading = i18n.t('Confirm Refreshing Org With Unretrieved Changes');
    warning = i18n.t(
      'This {{type}} has unretrieved changes which will be lost. Are you sure you want to refresh this org?',
      { type },
    );
    label = i18n.t('Refresh Org');
  } else {
    heading = i18n.t('Confirm Deleting Org With Unretrieved Changes');
    warning = i18n.t(
      'This {{type}} has unretrieved changes which will be lost. Are you sure you want to delete this org?',
      { type },
    );
    label = i18n.t('Delete Org');
  }

  return (
    <Modal
      isOpen={isOpen}
      heading={heading}
      prompt="warning"
      assistiveText={{ closeButton: i18n.t('Cancel') }}
      onRequestClose={handleCancel}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={handleCancel} />,
        <Button
          key="submit"
          label={label}
          variant="brand"
          onClick={handleSubmit}
        />,
      ]}
    >
      <div className="slds-p-vertical_medium">{warning}</div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
