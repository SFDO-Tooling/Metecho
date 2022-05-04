import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
    type = t('Test Org');
  } else if (org?.org_type === 'Dev') {
    type = t('Dev Org');
  } else {
    type = t('Scratch Org');
  }
  if (actionType === CONFIRM_ORG_TRACKER.REFRESH) {
    heading = t('Confirm Refreshing Org With Unretrieved Changes');
    warning = t(
      'This {{type}} has unretrieved changes which will be lost. Are you sure you want to refresh this Org?',
      { type },
    );
    label = t('Refresh Org');
  } else {
    heading = t('Confirm Deleting Org With Unretrieved Changes');
    warning = t(
      'This {{type}} has unretrieved changes which will be lost. Are you sure you want to delete this Org?',
      { type },
    );
    label = t('Delete Org');
  }

  return (
    <Modal
      isOpen={isOpen}
      heading={heading}
      prompt="warning"
      assistiveText={{ closeButton: t('Cancel') }}
      onRequestClose={handleCancel}
      footer={[
        <Button key="cancel" label={t('Cancel')} onClick={handleCancel} />,
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
