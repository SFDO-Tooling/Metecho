import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useCallback } from 'react';
import { Trans } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '@/store';
import { deleteObject } from '@/store/actions';
import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';
import { OBJECT_TYPES } from '@/utils/constants';

const DeleteModal = ({
  model,
  modelType,
  isOpen,
  handleClose,
}: {
  model: Project | Task;
  modelType: 'project' | 'task';
  isOpen: boolean;
  handleClose: () => void;
}) => {
  const dispatch = useDispatch<ThunkDispatch>();

  const doDelete = useCallback(() => {
    /* istanbul ignore else */
    if (model) {
      dispatch(
        deleteObject({
          objectType: modelType,
          object: model,
        }),
      ).finally(() => {
        handleClose();
      });
    }
  }, [dispatch, model, modelType, handleClose]);

  let heading;
  switch (modelType) {
    case OBJECT_TYPES.PROJECT:
      heading = i18n.t('Delete Project');
      break;
    case OBJECT_TYPES.TASK:
      heading = i18n.t('Delete Task');
      break;
  }

  return (
    <Modal
      isOpen={isOpen}
      heading={heading}
      onRequestClose={handleClose}
      prompt="warning"
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={handleClose} />,
        <Button
          key="submit"
          label={i18n.t('Delete')}
          variant="brand"
          onClick={doDelete}
        />,
      ]}
    >
      <div className="slds-p-vertical_medium slds-text-align_center">
        <Trans i18nKey="confirmDelete" name={name}>
          Are you sure you want to delete{' '}
          <span className="lowercase">{{ status: model.status }}</span>{' '}
          {{ modelType }} &quot;{{ name: model.name }}&quot;?
        </Trans>
      </div>
    </Modal>
  );
};

export default DeleteModal;
