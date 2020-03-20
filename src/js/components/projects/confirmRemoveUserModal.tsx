import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import { UserCard } from '@/components/user/githubUser';
import { GitHubUser } from '@/store/user/reducer';

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
  const heading =
    count === 1
      ? i18n.t('Confirm Removing Collaborator')
      : i18n.t('Confirm Removing Collaborators');

  return (
    <Modal
      isOpen={isOpen}
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
        <Trans i18nKey="confirmRemoveCollaborators">
          The following users are being removed from this project, but are
          already assigned to at least one task in this project. Are you sure
          you want to remove them from the project? This will not remove them
          from any assigned tasks.
        </Trans>
        <ul>
          {(confirmRemoveUsers as GitHubUser[]).map((user) => (
            <li key={user.id}>
              <UserCard user={user} />
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default ConfirmRemoveUserModal;
