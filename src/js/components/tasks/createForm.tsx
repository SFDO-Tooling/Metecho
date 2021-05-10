import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useRef, useState } from 'react';

import SelectFlowType from '~js/components/tasks/selectFlowType';
import {
  LabelWithSpinner,
  useForm,
  useIsMounted,
  useTransientMessage,
} from '~js/components/utils';
import { Epic } from '~js/store/epics/reducer';
import { Project } from '~js/store/projects/reducer';
import { DEFAULT_ORG_CONFIG_NAME, OBJECT_TYPES } from '~js/utils/constants';

interface Props {
  project: Project;
  epic: Epic;
  isOpen: boolean;
  closeCreateModal: () => void;
}

const CreateTaskModal = ({
  project,
  epic,
  isOpen,
  closeCreateModal,
}: Props) => {
  const isMounted = useIsMounted();
  const { showTransientMessage, isShowingTransientMessage } =
    useTransientMessage();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const submitButton = useRef<HTMLButtonElement | null>(null);

  /* istanbul ignore next */
  const onError = () => {
    if (isMounted.current) {
      setIsSaving(false);
      setIsSavingBatch(false);
    }
  };

  const { inputs, errors, handleInputChange, handleSubmit, resetForm } =
    useForm({
      fields: {
        name: '',
        description: '',
        org_config_name: DEFAULT_ORG_CONFIG_NAME,
      },
      objectType: OBJECT_TYPES.TASK,
      additionalData: {
        epic: epic.id,
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
    handleSubmit(e, { success: addSuccess });
  };

  const batchAddSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      resetForm();
      setIsSavingBatch(false);
      showTransientMessage();
    }
  };
  const batchSubmitClicked = (e: React.MouseEvent<HTMLFormElement>) => {
    setIsSavingBatch(true);
    handleSubmit(e, { success: batchAddSuccess });
  };

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={isSaving || isSavingBatch}
      heading={i18n.t('Add a Task for {{epic_name}}', { epic_name: epic.name })}
      assistiveText={{ closeButton: i18n.t('Cancel') }}
      onRequestClose={closeModal}
      footer={[
        isShowingTransientMessage && (
          <span
            key="success"
            className="slds-text-color_success
              slds-float_left
              slds-p-left_x-small
              slds-p-top_xx-small
              metecho-transition-out"
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
          className="metecho-textarea"
          name="description"
          value={inputs.description}
          errorText={errors.description}
          onChange={handleInputChange}
        />
        <SelectFlowType
          orgConfigs={project.org_config_names || []}
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
