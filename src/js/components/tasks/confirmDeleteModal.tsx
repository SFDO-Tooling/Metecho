import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';

import { Org, OrgsByTask } from '@/store/orgs/reducer';
import { OrgTypes } from '@/utils/constants';

const ConfirmDeleteModal = ({
  orgs,
  orgType,
  handleClose,
  handleDelete,
}: {
  orgs: OrgsByTask;
  orgType: OrgTypes | null;
  handleClose: () => void;
  handleDelete: (org: Org) => void;
}) => {
  const handleSubmit = () => {
    handleClose();
    const org = orgType && orgs[orgType];
    /* istanbul ignore else */
    if (org) {
      handleDelete(org);
    }
  };

  return (
    <Modal
      isOpen={Boolean(orgType)}
      heading={i18n.t('Confirm Delete Org With Uncaptured Changes')}
      prompt="warning"
      onRequestClose={handleClose}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={handleClose} />,
        <Button
          key="submit"
          label={i18n.t('Delete')}
          variant="brand"
          onClick={handleSubmit}
        />,
      ]}
    >
      <div className="slds-p-vertical_medium">
        {i18n.t(
          'This scratch org has uncaptured changes which will be lost. Are you sure you want to delete this org?',
        )}
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
