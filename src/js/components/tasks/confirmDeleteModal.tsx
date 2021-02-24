import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';

import { Org, OrgsByParent } from '~js/store/orgs/reducer';
import { ORG_TYPES } from '~js/utils/constants';

const ConfirmDeleteModal = ({
  orgs,
  isOpen,
  handleClose,
  handleCancel,
  handleDelete,
}: {
  orgs: OrgsByParent;
  isOpen: boolean;
  handleClose: () => void;
  handleCancel: () => void;
  handleDelete: (org: Org) => void;
}) => {
  const handleSubmit = () => {
    handleClose();
    const org = orgs[ORG_TYPES.DEV];
    /* istanbul ignore else */
    if (org) {
      handleDelete(org);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      heading={i18n.t('Confirm Deleting Org With Unretrieved Changes')}
      prompt="warning"
      onRequestClose={handleCancel}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={handleCancel} />,
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
          'This scratch org has unretrieved changes which will be lost. Are you sure you want to delete this org?',
        )}
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
