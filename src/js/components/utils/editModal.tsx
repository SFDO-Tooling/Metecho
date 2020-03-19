import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';

import { useForm, useIsMounted } from '@/components/utils';
import { Project } from '@/store/projects/reducer';

interface EditModalProps {
  project: Project;
  isOpen: boolean;
  toggleModal: (open: boolean) => void;
  handleClose: () => void;
}
const EditModal = ({
  project,
  isOpen,
  toggleModal,
  handleClose,
}: EditModalProps) => {
  const form = useRef<HTMLFormElement | null>(null);
  const submitButton = useRef<HTMLButtonElement | null>(null);

  const handleSuccess = () => {
    handleClose();
  };

  const defaultName = project.name;
  const defaultDescription = project.description.replace(/<(.|\n)*?>/g, '');

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
    additionalData: _.omit(project, ['name', 'description']),
    onSuccess: handleSuccess,
    shouldSubscribeToObject: false,
    objectType: 'project',
    update: true,
  });

  const defaultNameRef = useRef(defaultName);
  useEffect(() => {
    const prevDefaultName = defaultNameRef.current;
    if (defaultName !== prevDefaultName) {
      setInputs({ ...inputs, name: defaultName });
      defaultNameRef.current = defaultName;
    }
  }, [defaultName, inputs, setInputs]);

  const defaultDescriptionRef = useRef(defaultDescription);
  useEffect(() => {
    const prevDefaultDescription = defaultDescriptionRef.current;
    if (defaultDescription !== prevDefaultDescription) {
      setInputs({ ...inputs, description: defaultDescription });
      defaultDescriptionRef.current = defaultDescription;
    }
  }, [defaultDescription, inputs, setInputs]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
  };

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
      heading="Edit Project Name and Description"
      onRequestClose={doClose}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={doClose} />,
        <Button
          key="submit"
          type="submit"
          label="Save"
          variant="brand"
          onClick={onSubmitClicked}
        />,
      ]}
    >
      <form
        className="slds-form slds-p-around_large"
        onSubmit={onSubmit}
        ref={form}
      >
        <div className="slds-grid slds-wrap slds-gutters">
          <div
            className="slds-col
              slds-size_1-of-1
              slds-medium-size_6-of-12
              slds-large-size_8-of-12
              slds-p-bottom_medium"
          >
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
              className="ms-textarea slds-p-bottom_small"
              name="description"
              value={inputs.description}
              errorText={errors.critical_changes}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <button ref={submitButton} type="submit" style={{ display: 'none' }} />
      </form>
    </Modal>
  );
};
export default EditModal;
