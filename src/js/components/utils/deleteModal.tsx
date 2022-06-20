import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      heading = t('Confirm Deleting Epic');
      message = (
        <Trans i18nKey="confirmDeleteEpic">
          Are you sure you want to delete Epic “{{ name: model.name }}”? This
          will also delete any Tasks and Orgs in this Epic.
        </Trans>
      );
      break;
    case OBJECT_TYPES.TASK:
      heading = t('Confirm Deleting Task');
      message = (
        <Trans i18nKey="confirmDeleteTask">
          Are you sure you want to delete Task “{{ name: model.name }}”? This
          will also delete any Orgs in this Task.
        </Trans>
      );
      break;
  }

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      assistiveText={{ closeButton: t('Cancel') }}
      disableClose={isSaving}
      heading={heading}
      onRequestClose={handleClose}
      prompt="warning"
      footer={[
        <Button
          key="cancel"
          label={t('Cancel')}
          onClick={handleClose}
          disabled={isSaving}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            isSaving ? (
              <LabelWithSpinner label={t('Deleting…')} variant="inverse" />
            ) : (
              t('Delete')
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
