import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import { omit } from 'lodash';
import React, { useRef } from 'react';

import { useForm, useFormDefaults, useIsMounted } from '@/components/utils';
import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';
import { OBJECT_TYPES } from '@/utils/constants';

interface EditModalProps {
  model: Project | Task;
  isOpen: boolean;
  instanceType: 'project' | 'task';
  handleClose: () => void;
}
const EditModal = ({
  model,
  isOpen,
  instanceType,
  handleClose,
}: EditModalProps) => {
  const isMounted = useIsMounted();
  const submitButton = useRef<HTMLButtonElement | null>(null);

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      handleClose();
    }
  };

  const defaultName = model.name;
  const defaultDescription = model.description;

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
    },
    additionalData: omit(model, ['name', 'description']),
    onSuccess: handleSuccess,
    objectType: instanceType,
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

  const doClose = () => {
    handleClose();
    resetForm();
  };

  const onSubmitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      size="medium"
      heading={i18n.t(`Edit ${instanceType}`)}
      onRequestClose={doClose}
      headerClassName="capitalize"
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={doClose} />,
        <Button
          key="submit"
          type="submit"
          label={i18n.t('Save')}
          variant="brand"
          onClick={onSubmitClicked}
        />,
      ]}
    >
      <form className="slds-form slds-p-around_large" onSubmit={handleSubmit}>
        <Input
          id="edit-name"
          label={
            <span className="capitalize">{i18n.t(`${instanceType} Name`)}</span>
          }
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
        {/* Clicking hidden button allows for native browser form validation */}
        <button ref={submitButton} type="submit" style={{ display: 'none' }} />
      </form>
    </Modal>
  );
};
export default EditModal;
