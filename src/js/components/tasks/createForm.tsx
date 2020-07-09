import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { AnyAction } from 'redux';

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

  const onSuccess = (action: AnyAction) => {
    const {
      type,
      payload: { object, objectType },
    } = action;
    if (
      isMounted.current &&
      type === 'CREATE_OBJECT_SUCCEEDED' &&
      objectType === OBJECT_TYPES.TASK &&
      object
    ) {
      setIsSaving(false);
      setSuccess(true);
      successTimeout.current = setTimeout(() => {
        setSuccess(false);
      }, 3000);
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
    onSuccess,
  });

  const submitClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      e.preventDefault();
    }
    if (submitButton.current) {
      submitButton.current.click();
      if (inputs.name) {
        setIsSaving(true);
      }
    }
  };
  const closeModal = () => {
    closeCreateModal();
    resetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      size="medium"
      heading={`${i18n.t('Add a Task for')} ${project.name}`}
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
          // onClick={doClose}
          disabled={isSaving}
          type="submit"
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
          disabled={isSaving}
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
        {/* Clicking hidden button allows for native browser form validation */}
        <button
          ref={submitButton}
          type="submit"
          style={{ display: 'none' }}
          disabled={isSaving}
        />
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
