import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useEffect, useRef, useState } from 'react';

import SelectFlowType from '@/components/tasks/selectFlowType';
import { LabelWithSpinner, useForm, useIsMounted } from '@/components/utils';
import { Project } from '@/store/projects/reducer';
import { DEFAULT_ORG_CONFIG_NAME, OBJECT_TYPES } from '@/utils/constants';

interface Props {
  project: Project;
  isOpen: boolean;
  closeCreateModal: () => void;
}

const CreateTaskModal = ({ project, isOpen, closeCreateModal }: Props) => {
  const isMounted = useIsMounted();
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const successTimeout = useRef<NodeJS.Timeout | null>(null);
  const submitButton = useRef<HTMLButtonElement | null>(null);

  const clearSuccessTimeout = () => {
    if (typeof successTimeout.current === 'number') {
      clearTimeout(successTimeout.current);
      successTimeout.current = null;
    }
  };

  useEffect(
    () => () => {
      clearSuccessTimeout();
    },
    [],
  );

  /* istanbul ignore next */
  const onError = () => {
    if (isMounted.current) {
      setIsSaving(false);
      setIsSavingBatch(false);
    }
  };

  const {
    inputs,
    errors,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: {
      name: '',
      description: '',
      org_config_name: DEFAULT_ORG_CONFIG_NAME,
    },
    objectType: OBJECT_TYPES.TASK,
    additionalData: {
      project: project.id,
    },
    onError,
  });

  const closeModal = () => {
    closeCreateModal();
    resetForm();
  };

  const addSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIsSaving(false);
      closeModal();
    }
  };
  const submitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };
  const doSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSaving(true);
    handleSubmit(e, undefined, addSuccess);
  };

  const batchAddSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      resetForm();
      setIsSavingBatch(false);
      setSuccess(true);
      successTimeout.current = setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }
  };
  const batchSubmitClicked = (e: React.MouseEvent<HTMLFormElement>) => {
    setIsSavingBatch(true);
    handleSubmit(e, undefined, batchAddSuccess);
  };

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={isSaving || isSavingBatch}
      heading={`${i18n.t('Add a Task for')} ${project.name}`}
      onRequestClose={closeModal}
      footer={[
        success && (
          <span
            key="success"
            className="slds-text-color_success
              slds-float_left
              slds-p-left_x-small
              slds-p-top_xx-small
              ms-transition-out"
          >
            {i18n.t('A task was successfully added.')}
          </span>
        ),
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          onClick={closeModal}
          disabled={isSaving || isSavingBatch}
        />,
        <Button
          key="create-new"
          label={
            isSavingBatch ? (
              <LabelWithSpinner label={i18n.t('Adding…')} />
            ) : (
              i18n.t('Add & New')
            )
          }
          onClick={batchSubmitClicked}
          disabled={isSaving || isSavingBatch}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            isSaving ? (
              <LabelWithSpinner label={i18n.t('Adding…')} variant="inverse" />
            ) : (
              i18n.t('Add')
            )
          }
          variant="brand"
          onClick={submitClicked}
          disabled={isSaving || isSavingBatch}
        />,
      ]}
    >
      <form onSubmit={doSubmit} className="slds-form slds-p-around_large">
        <Input
          id="task-name"
          label={i18n.t('Task Name')}
          className="slds-form-element_stacked slds-p-left_none"
          name="name"
          value={inputs.name}
          required
          aria-required
          errorText={errors.name}
          onChange={handleInputChange}
        />
        <Textarea
          id="task-description"
          label={i18n.t('Description')}
          classNameContainer="slds-form-element_stacked slds-p-left_none"
          name="description"
          value={inputs.description}
          errorText={errors.description}
          onChange={handleInputChange}
        />
        <SelectFlowType
          orgConfigs={project.available_task_org_config_names}
          projectId={project.id}
          value={inputs.org_config_name}
          errors={errors.org_config_name}
          isLoading={project.currently_fetching_org_config_names}
          handleSelect={handleInputChange}
        />
        {/* Clicking hidden button allows for native browser form validation */}
        <button
          ref={submitButton}
          type="submit"
          style={{ display: 'none' }}
          disabled={isSaving || isSavingBatch}
        />
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
