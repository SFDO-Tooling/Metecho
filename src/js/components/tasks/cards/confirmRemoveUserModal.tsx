import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';

import { AssignedUserTracker } from '@/components/tasks/cards';
import { Org, OrgsByTask } from '@/store/orgs/reducer';
import { ORG_TYPES } from '@/utils/constants';

const ConfirmRemoveUserModal = ({
  orgs,
  assignedUser,
  handleClose,
  handleDelete,
}: {
  orgs: OrgsByTask;
  assignedUser: AssignedUserTracker | null;
  handleClose: () => void;
  handleDelete: (
    org: Org,
    shouldRemoveUser?: AssignedUserTracker | null,
  ) => void;
}) => {
  const type = assignedUser?.type;
  const handleSubmit = () => {
    const org = type && orgs[type];
    handleClose();
    /* istanbul ignore else */
    if (org && assignedUser) {
      handleDelete(org, { ...assignedUser });
    }
  };
  const heading =
    type === ORG_TYPES.QA
      ? i18n.t('Confirm Changing Reviewer and Deleting Review Org')
      : i18n.t('Confirm Changing Developer and Deleting Dev Org');

  return (
    <Modal
      isOpen={Boolean(assignedUser)}
      heading={heading}
      prompt="warning"
      onRequestClose={handleClose}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={handleClose} />,
        <Button
          key="submit"
          label={i18n.t('Confirm')}
          variant="brand"
          onClick={handleSubmit}
        />,
      ]}
    >
      <div className="slds-p-vertical_medium">
        {type === ORG_TYPES.QA
          ? i18n.t('There is an existing Review Org for this task.')
          : i18n.t('There is an existing Dev Org for this task.')}{' '}
        {i18n.t(
          'Changing this role will also delete the org. Are you sure you want to do that?',
        )}
      </div>
    </Modal>
  );
};

export default ConfirmRemoveUserModal;
