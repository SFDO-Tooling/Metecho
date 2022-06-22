import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { AssignedUserTracker } from '@/js/components/orgs/taskOrgCards';

const ConfirmRemoveUserModal = ({
  isOpen,
  waitingToRemoveUser,
  handleClose,
  handleCancel,
  handleAssignUser,
}: {
  isOpen: boolean;
  waitingToRemoveUser: AssignedUserTracker | null;
  handleClose: () => void;
  handleCancel: () => void;
  handleAssignUser: ({
    type,
    assignee,
    shouldAlertAssignee,
  }: AssignedUserTracker) => void;
}) => {
  const { t } = useTranslation();

  const handleSubmit = () => {
    handleClose();
    /* istanbul ignore else */
    if (waitingToRemoveUser) {
      handleAssignUser(waitingToRemoveUser);
    }
  };

  const heading = waitingToRemoveUser?.assignee
    ? t('Confirm Changing Developer and Deleting Dev Org')
    : t('Confirm Removing Developer and Deleting Dev Org');
  const message = waitingToRemoveUser?.assignee
    ? t(
        'The existing Dev Org for this Task has unretrieved changes. Changing the assigned Developer will also delete the Org, and any changes will be lost. Are you sure you want to do that?',
      )
    : t(
        'The existing Dev Org for this Task has unretrieved changes. Removing the assigned Developer will also delete the Org, and any changes will be lost. Are you sure you want to do that?',
      );

  return (
    <Modal
      isOpen={Boolean(isOpen && waitingToRemoveUser)}
      heading={heading}
      prompt="warning"
      assistiveText={{ closeButton: t('Cancel') }}
      dismissOnClickOutside={false}
      onRequestClose={handleCancel}
      footer={[
        <Button key="cancel" label={t('Cancel')} onClick={handleCancel} />,
        <Button
          key="submit"
          label={t('Confirm')}
          variant="brand"
          onClick={handleSubmit}
        />,
      ]}
    >
      <div className="slds-p-vertical_medium">{message}</div>
    </Modal>
  );
};

export default ConfirmRemoveUserModal;
