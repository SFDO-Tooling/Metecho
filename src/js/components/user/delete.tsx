import Button from '@salesforce/design-system-react/components/button';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

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
  return (
    <div>
      <div className="slds-text-heading_large">Delete Account</div>
      <div>
        Deleting this account will not remove you as a Project collaborator on
        Github. Your Dev Orgs will be deleted, and any unretrieved changes will
        be lost. This action cannot be undone.
      </div>
      <Button
        key="delete"
        label="Delete Account"
        variant="brand"
        onClick={openDeleteModal}
      />
      <DeleteModal
        model={user as User}
        modelType={OBJECT_TYPES.USER}
        isOpen={deleteModalOpen}
        redirect={routes.home()}
        handleClose={closeDeleteModal}
      />
    </div>
  );
};
export default DeleteAccount;
