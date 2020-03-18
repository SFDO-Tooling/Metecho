import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useCallback, useEffect, useRef } from 'react';

import { useForm } from '@/components/utils';
import { Project } from '@/store/projects/reducer';

interface EditModalProps {
  project: Project;
  isOpen: boolean;
  toggleModal: (open: boolean) => void;
}
const EditModal = ({ project, isOpen, toggleModal }: EditModalProps) => {
  const form = useRef<HTMLFormElement | null>(null);
  const submitButton = useRef<HTMLButtonElement | null>(null);

  const { handleSubmitFromRef } = useForm({
    fields: { name: '', description: '' },
  });
  const onSubmit = useCallback((e) => {
    e.preventDefault();
    if (form) {
      const { name, description } = form.current;
      const data = {
        ...project,
        name: name.value,
        description: description.value,
      };
      handleSubmitFromRef(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };

  const handleClose = () => {
    toggleModal(false);
  };

  useEffect(() => {
    console.log(form);
  }, [form]);

  return (
    <Modal
      isOpen={isOpen}
      size="medium"
      heading="Edit Project Name and Description"
      footer={[
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          onClick={handleClose}
          // disabled={submittingReview}
        />,
        <Button
          key="submit"
          type="submit"
          label="Save"
          variant="brand"
          onClick={onSubmitClicked}
          // disabled={submittingReview}
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
              label={i18n.t('Title')}
              className="slds-p-bottom_small"
              name="name"
              defaultValue={project.name}
              required
              aria-required
              //   errorText={errors.title}
              //   onChange={handleInputChange}
            />
            <Textarea
              id="edit-project-description"
              label={i18n.t(
                'Describe any critical changes which might impact existing functionality',
              )}
              className="ms-textarea slds-p-bottom_small"
              name="description"
              defaultValue={project.description}
              //   errorText={errors.critical_changes}
              //   onChange={handleInputChange}
            />
          </div>
        </div>
        <button
          ref={submitButton}
          type="submit"
          style={{ display: 'none' }}
          disabled={false}
        />
      </form>
    </Modal>
  );
};
export default EditModal;
