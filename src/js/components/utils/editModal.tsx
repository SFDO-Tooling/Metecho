import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import { omit } from 'lodash';
import React, { useRef, useState } from 'react';

import SelectFlowType from '@/components/tasks/selectFlowType';
import {
  LabelWithSpinner,
  useForm,
  useFormDefaults,
  useIsMounted,
} from '@/components/utils';
import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';
import {
  OBJECT_TYPES,
  ObjectTypes,
  ORG_TYPES,
  TASK_STATUSES,
} from '@/utils/constants';

interface EditModalProps {
  model: Project | Task;
  modelType: ObjectTypes;
  isOpen: boolean;
  handleClose: () => void;
}
const EditModal = ({
  model,
  modelType,
  isOpen,
  handleClose,
}: EditModalProps) => {
  const isMounted = useIsMounted();
  const submitButton = useRef<HTMLButtonElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIsSaving(false);
      handleClose();
    }
  };

  /* istanbul ignore next */
  const handleError = () => {
    if (isMounted.current) {
      setIsSaving(false);
    }
  };

  const defaultName = model.name;
  const defaultDescription = model.description;
  const defaultFlowType = model.flow_type || ORG_TYPES.DEV;

  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: {
      name: defaultName,
      description: defaultDescription,
      flow_type: defaultFlowType,
    },
    additionalData: omit(model, ['name', 'description']),
    onSuccess: handleSuccess,
    onError: handleError,
    objectType: modelType,
    update: true,
  });

  // When name or description changes, update default selection
  useFormDefaults({
    field: 'name',
    value: defaultName,
    inputs,
    setInputs,
  });
  useFormDefaults({
    field: 'description',
    value: defaultDescription,
    inputs,
    setInputs,
  });
  useFormDefaults({
    field: 'flow_type',
    value: defaultFlowType,
    inputs,
    setInputs,
  });

  const doClose = () => {
    handleClose();
    resetForm();
  };

  const submitInstance = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSaving(true);
    handleSubmit(e);
  };

  const onSubmitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };

  let heading, nameLabel;
  switch (modelType) {
    case OBJECT_TYPES.TASK:
      nameLabel = i18n.t('Task Name');
      heading = i18n.t('Edit Task');
      break;
    case OBJECT_TYPES.PROJECT:
      nameLabel = i18n.t('Project Name');
      heading = i18n.t('Edit Project');
      break;
  }

  return (
    <Modal
      isOpen={isOpen}
      size="medium"
      disableClose={isSaving}
      heading={heading}
      onRequestClose={doClose}
      footer={[
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          onClick={doClose}
          disabled={isSaving}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            isSaving ? (
              <LabelWithSpinner label={i18n.t('Saving…')} variant="inverse" />
            ) : (
              i18n.t('Save')
            )
          }
          variant="brand"
          onClick={onSubmitClicked}
          disabled={isSaving}
        />,
      ]}
    >
      <form className="slds-form slds-p-around_large" onSubmit={submitInstance}>
        <Input
          id="edit-name"
          label={nameLabel}
          className="slds-p-bottom_small"
          name="name"
          value={inputs.name}
          required
          aria-required
          errorText={errors.name}
          onChange={handleInputChange}
        />
        <Textarea
          id="edit-description"
          label={i18n.t('Description')}
          className="ms-textarea"
          name="description"
          value={inputs.description}
          errorText={errors.description}
          onChange={handleInputChange}
        />
        {/* display for tasks, disable if task has a scratch org  */}
        {modelType === OBJECT_TYPES.TASK && (
          <SelectFlowType
            handleSelect={handleInputChange}
            isDisabled={model.status !== TASK_STATUSES.PLANNED}
            orgConfig={inputs.flow_type}
          />
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
export default EditModal;
