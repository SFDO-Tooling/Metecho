import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import { UserCard } from '@/js/components/githubUsers/cards';
import { GitHubUser } from '@/js/store/user/reducer';

const ConfirmRemoveUserModal = ({
  confirmRemoveUsers,
  waitingToUpdateUsers,
  handleClose,
  handleUpdateUsers,
}: {
  confirmRemoveUsers: GitHubUser[] | null;
  waitingToUpdateUsers: GitHubUser[] | null;
  handleClose: () => void;
  handleUpdateUsers: (users: GitHubUser[]) => void;
}) => {
  const isOpen = Boolean(confirmRemoveUsers?.length && waitingToUpdateUsers);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    /* istanbul ignore else */
    if (waitingToUpdateUsers) {
      handleUpdateUsers(waitingToUpdateUsers);
    }
    handleClose();
  };

  const count = (confirmRemoveUsers as GitHubUser[]).length;

  return (
    <Modal
      isOpen={isOpen}
      heading={i18n.t(
        'confirmRemoveCollaboratorsHeading',
        'Confirm Removing Collaborator',
        { count },
      )}
      prompt="warning"
      onRequestClose={handleClose}
      assistiveText={{ closeButton: i18n.t('Cancel') }}
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
      <div className="slds-p-top_small">
        <Trans i18nKey="confirmRemoveCollaboratorsMessage" count={count}>
          The following user is being removed from this epic, but is already
          assigned to at least one task. Removing this user will not remove them
          from any assigned tasks. Are you sure you want to remove this user
          from the epic?
        </Trans>
        <ul>
          {(confirmRemoveUsers as GitHubUser[]).map((user) => (
            <li key={user.id}>
              <UserCard user={user} className="has-nested-card" />
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default ConfirmRemoveUserModal;
