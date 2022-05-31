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
      <div className="slds-text-heading_large slds-m-bottom_small">
        Delete Account
      </div>
      <div className="slds-m-bottom_medium slds-text-body_regular">
        Your Dev Orgs will be deleted, and any unretrieved changes will be lost.
        This action cannot be undone. Deleting this account will not remove you
        as a Project collaborator on Github.
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
        redirect={routes.login()}
        handleClose={closeDeleteModal}
      />

      <div className="slds-m-top_xx-large">
        <div className="slds-text-heading_large slds-m-bottom_small">
          Tasks With Unretrieved Changes
        </div>
        <div className="slds-m-bottom_medium slds-text-body_regular">
          Below is a list of Tasks where you are currently assigned as the
          Developer or Tester. If you have any Dev Orgs with unsaved work,
          access them from the Task page to retrieve changes before deleting
          your account.
        </div>
      </div>
    </div>
  );
};
export default DeleteAccount;
