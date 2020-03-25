import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';

import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';

const DeleteModal = ({
  model,
  instanceType,
  isOpen,
  handleCancel,
  handleSubmit,
}: {
  model: Project | Task;
  instanceType: 'project' | 'task';
  isOpen: boolean;
  handleCancel: () => void;
  handleSubmit: () => void;
}) => (
  // open close on parent
  // handlesubmit on parent
  // on success, redirect to project list?
  // model.status, model.name, instanceType
  <Modal
    isOpen={isOpen}
    heading={i18n.t('Confirm Deleting Org With Uncaptured Changes')}
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
        'This scratch org has uncaptured changes which will be lost. Are you sure you want to delete this org?',
      )}
    </div>
  </Modal>
);
export default DeleteModal;
