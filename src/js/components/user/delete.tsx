import Button from '@salesforce/design-system-react/components/button';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import UserTasks from '@/js/components/user/userTasks';
import { DeleteModal } from '@/js/components/utils';
import { User } from '@/js/store/user/reducer';
import { selectUserState } from '@/js/store/user/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

const DeleteAccount = () => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const user = useSelector(selectUserState);
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };
  const openDeleteModal = () => {
    setDeleteModalOpen(true);
  };
  const { t } = useTranslation();

  return (
    <>
      <div className="slds-text-heading_large slds-m-bottom_small">
        {t('Delete Account')}
      </div>
      <div className="slds-m-bottom_medium slds-text-body_regular">
        <Trans i18nKey="deleteAccountChanges">
          Your Dev Orgs will be deleted, and any unretrieved changes will be
          lost. This action cannot be undone. Deleting this account will not
          remove you as a Project collaborator on GitHub.
        </Trans>
      </div>
      <Button
        label={t('Delete Account')}
        variant="brand"
        onClick={openDeleteModal}
      />
      <DeleteModal
        model={user as User}
        modelType={OBJECT_TYPES.USER}
        isOpen={deleteModalOpen}
        redirect={routes.login()}
        handleClose={closeDeleteModal}
      />
      <UserTasks />
    </>
  );
};

export default DeleteAccount;
