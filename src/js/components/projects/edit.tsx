import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useRef } from 'react';

import { Project } from '@/store/projects/reducer';

interface EditModalProps {
  project: Project;
  isOpen: boolean;
  toggleModal: boolean;
}
const EditModal = ({ project, isOpen, toggleModal }: EditModalProps) => {
  const editNameRef = useRef(null);
  const editDescriptionRef = useRef(null);
  const submitButton = useRef<HTMLButtonElement | null>(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(editNameRef.current, editDescriptionRef.current);
  };
  const handleSubmitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };
  const handleClose = () => {
    toggleModal(false);
  };
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
          onClick={handleSubmitClicked}
          // disabled={submittingReview}
        />,
      ]}
    >
      <form className="slds-form slds-p-around_large" onSubmit={handleSubmit}>
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
              ref={editNameRef}
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
              ref={editDescriptionRef}
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
