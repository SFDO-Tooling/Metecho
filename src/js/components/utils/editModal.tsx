import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import { omit } from 'lodash';
import React, { useEffect, useRef } from 'react';

import { useForm, useIsMounted } from '@/components/utils';
import { Project } from '@/store/projects/reducer';
import { OBJECT_TYPES } from '@/utils/constants';

interface EditModalProps {
  project: Project;
  isOpen: boolean;
  handleClose: () => void;
}
const EditModal = ({ project, isOpen, handleClose }: EditModalProps) => {
  const isMounted = useIsMounted();
  const submitButton = useRef<HTMLButtonElement | null>(null);

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      handleClose();
    }
  };

  const defaultName = project.name;
  const defaultDescription = project.description;

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
    additionalData: omit(project, ['name', 'description']),
    onSuccess: handleSuccess,
    objectType: OBJECT_TYPES.PROJECT,
    update: true,
  });

  // When name or description changes, update default selection
  const defaultNameRef = useRef(defaultName);
  const defaultDescriptionRef = useRef(defaultDescription);
  useEffect(() => {
    const prevDefaultName = defaultNameRef.current;
    const prevDefaultDescription = defaultDescriptionRef.current;
    const nameChanged = defaultName !== prevDefaultName;
    const descriptionChanged = defaultDescription !== prevDefaultDescription;
    if (nameChanged || descriptionChanged) {
      const newInputs = { ...inputs };
      /* istanbul ignore else */
      if (nameChanged) {
        newInputs.name = defaultName;
        defaultNameRef.current = defaultName;
      }
      /* istanbul ignore else */
      if (descriptionChanged) {
        newInputs.description = defaultDescription;
        defaultDescriptionRef.current = defaultDescription;
      }
      setInputs(newInputs);
    }
  }, [defaultName, defaultDescription, inputs, setInputs]);

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
      heading={i18n.t('Edit Project')}
      onRequestClose={doClose}
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
          id="edit-project-name"
          label={i18n.t('Project Name')}
          className="slds-p-bottom_small"
          name="name"
          value={inputs.name}
          required
          aria-required
          errorText={errors.name}
          onChange={handleInputChange}
        />
        <Textarea
          id="edit-project-description"
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
