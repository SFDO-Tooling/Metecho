import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';
import { OBJECT_TYPES } from '@/utils/constants';

const DeleteModal = ({
  model,
  instanceType,
  isOpen,
  handleClose,
  handleDelete,
}: {
  model: Project | Task;
  instanceType: 'project';
  isOpen: boolean;
  handleClose: () => void;
  handleDelete: () => void;
}) => {
  const handleConfirmDelete = () => {
    handleClose();
    handleDelete();
  };

  let heading;
  switch (instanceType) {
    case OBJECT_TYPES.PROJECT:
      i18n.t('Delete Project');
      break;
  }

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
          label={i18n.t('Delete')}
          variant="brand"
          onClick={handleConfirmDelete}
        />,
      ]}
    >
      <div className="slds-p-vertical_medium">
        <Trans i18nKey="confirmDelete" name={name}>
          Are you sure you want to delete{' '}
          <span className="lowercase">{{ status: model.status }}</span>{' '}
          {{ instanceType }} &quot;{{ name: model.name }}&quot;?
        </Trans>
      </div>
    </Modal>
  );
};

export default DeleteModal;
