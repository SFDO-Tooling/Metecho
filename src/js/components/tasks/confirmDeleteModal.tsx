import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';

import { AssignedUserTracker } from '@/components/tasks/cards';
import { Org, OrgsByTask } from '@/store/orgs/reducer';
import { ORG_TYPES } from '@/utils/constants';

const ConfirmDeleteModal = ({
  orgs,
  isOpen,
  waitingToRemoveUser,
  handleClose,
  handleCancel,
  handleDelete,
}: {
  orgs: OrgsByTask;
  isOpen: boolean;
  waitingToRemoveUser: AssignedUserTracker | null;
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

  let heading = i18n.t('Confirm Deleting Org With Uncaptured Changes');
  let message = i18n.t(
    'This scratch org has uncaptured changes which will be lost. Are you sure you want to delete this org?',
  );
  if (waitingToRemoveUser) {
    heading = waitingToRemoveUser.assignee
      ? i18n.t('Confirm Changing Developer and Deleting Dev Org')
      : i18n.t('Confirm Removing Developer and Deleting Dev Org');
    message = waitingToRemoveUser.assignee
      ? i18n.t(
          'The existing Dev Org for this task has uncaptured changes. Changing the assigned developer will also delete the org, and any changes will be lost. Are you sure you want to do that?',
        )
      : i18n.t(
          'The existing Dev Org for this task has uncaptured changes. Removing the assigned developer will also delete the org, and any changes will be lost. Are you sure you want to do that?',
        );
  }

  return (
    <Modal
      isOpen={isOpen}
      heading={heading}
      prompt="warning"
      onRequestClose={handleCancel}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={handleCancel} />,
        <Button
          key="submit"
          label={i18n.t('Confirm')}
          variant="brand"
          onClick={handleSubmit}
        />,
      ]}
    >
      <div className="slds-p-vertical_medium">{message}</div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
