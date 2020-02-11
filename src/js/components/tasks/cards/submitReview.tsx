import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import React from 'react';

interface Props {
  isOpen: boolean;
  handleCancel: () => void;
  doSubmitReview: () => void;
}
const SubmitReviewModal = ({ isOpen, handleCancel, doSubmitReview }: Props) => (
  <Modal
    isOpen={isOpen}
    heading="Submit Review Results"
    onRequestClose={handleCancel}
    footer={[
      <Button key="cancel" onClick={handleCancel} />,
      <Button key="submit" onClick={doSubmitReview} />,
    ]}
  >
    <div>Submit Form Goes here!</div>
  </Modal>
);

export default SubmitReviewModal;
