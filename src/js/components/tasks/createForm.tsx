import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useEffect, useRef, useState } from 'react';

import SelectFlowType from '@/components/tasks/selectFlowType';
import { LabelWithSpinner, useForm } from '@/components/utils';
import { Project } from '@/store/projects/reducer';
import { DEFAULT_ORG_CONFIG_NAME, OBJECT_TYPES } from '@/utils/constants';

interface Props {
  project: Project;
  isOpen: boolean;
  closeCreateModal: () => void;
}

const CreateTaskModal = ({ project, isOpen, closeCreateModal }: Props) => {
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const successTimeout = useRef<NodeJS.Timeout | null>(null);

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
  });

  useEffect(() => {
    // re-enable submit btns on error
    if (errors) {
      if (isSaving) {
        setIsSaving(false);
      }
    }
  }, [errors, isSaving]);

  const addSuccess = () => {
    setIsSaving(false);
    resetForm();
    closeCreateModal();
  };
  const submitClicked = (e: React.MouseEvent<HTMLFormElement>) => {
    if (!isOpen) {
      e.preventDefault();
    }
    if (inputs.name) {
      setIsSaving(true);
      handleSubmit(e, undefined, () => addSuccess());
    }
  };

  const batchAddSuccess = () => {
    setIsSaving(false);
    setSuccess(true);
    resetForm();
    successTimeout.current = setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };
  const batchSubmitClicked = (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputs.name) {
      setIsSaving(true);
      handleSubmit(e, undefined, () => batchAddSuccess());
    }
  };
  const closeModal = () => {
    closeCreateModal();
    resetForm();
  };

  const emptyName = !inputs.name;
  return (
    <Modal
      isOpen={isOpen}
      size="medium"
      heading={`${i18n.t('Add a Task for')} ${project.name}`}
      onRequestClose={closeModal}
      footer={[
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          onClick={closeModal}
          disabled={isSaving}
        />,
        <Button
          key="create-new"
          label={i18n.t('Add & New')}
          onClick={batchSubmitClicked}
          disabled={isSaving || emptyName}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            isSaving ? (
              <LabelWithSpinner label={i18n.t('Saving…')} variant="inverse" />
            ) : (
              i18n.t('Add')
            )
          }
          variant="brand"
          onClick={submitClicked}
          disabled={isSaving || emptyName}
        />,
      ]}
    >
      <form
        onSubmit={handleSubmit}
        className="slds-form slds-m-bottom--large slds-p-around_large"
      >
        {isOpen && (
          <>
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
          </>
        )}
        {success && (
          <span
            className="slds-p-left--medium
              slds-p-right--medium
              slds-text-color_success"
          >
            {i18n.t('A task was successfully added.')}
          </span>
        )}
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
