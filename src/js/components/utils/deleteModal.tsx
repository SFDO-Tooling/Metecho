import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { LabelWithSpinner, useIsMounted } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { deleteObject } from '@/js/store/actions';
import { Epic } from '@/js/store/epics/reducer';
import { Task } from '@/js/store/tasks/reducer';
import { OBJECT_TYPES, ObjectTypes } from '@/js/utils/constants';

interface Props extends RouteComponentProps {
  model: Epic | Task;
  modelType: ObjectTypes;
  isOpen: boolean;
  redirect: string;
  handleClose: () => void;
}

const DeleteModal = ({
  model,
  modelType,
  isOpen,
  redirect,
  handleClose,
  history,
}: Props) => {
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const [isSaving, setIsSaving] = useState(false);

  const doDelete = useCallback(() => {
    setIsSaving(true);
    dispatch(
      deleteObject({
        objectType: modelType,
        object: model,
      }),
    )
      .then(() => {
        history.push(redirect);
      })
      .finally(() => {
        /* istanbul ignore else */
        if (isMounted.current) {
          setIsSaving(false);
          handleClose();
        }
      });
  }, [dispatch, modelType, model, history, redirect, isMounted, handleClose]);

  let heading, message;
  switch (modelType) {
    case OBJECT_TYPES.EPIC:
      heading = i18n.t('Confirm Deleting Epic');
      message = (
        <Trans i18nKey="confirmDeleteEpic">
          Are you sure you want to delete epic “{{ name: model.name }}”? This
          will also delete any tasks and orgs in this epic.
        </Trans>
      );
      break;
    case OBJECT_TYPES.TASK:
      heading = i18n.t('Confirm Deleting Task');
      message = (
        <Trans i18nKey="confirmDeleteTask">
          Are you sure you want to delete task “{{ name: model.name }}”? This
          will also delete any orgs in this task.
        </Trans>
      );
      break;
  }

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      assistiveText={{ closeButton: i18n.t('Cancel') }}
      disableClose={isSaving}
      heading={heading}
      onRequestClose={handleClose}
      prompt="warning"
      footer={[
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          onClick={handleClose}
          disabled={isSaving}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            isSaving ? (
              <LabelWithSpinner label={i18n.t('Deleting…')} variant="inverse" />
            ) : (
              i18n.t('Delete')
            )
          }
          variant="brand"
          onClick={doDelete}
          disabled={isSaving}
        />,
      ]}
    >
      <div className="slds-p-vertical_medium slds-text-align_center">
        {message}
      </div>
    </Modal>
  );
};

export default withRouter(DeleteModal);
