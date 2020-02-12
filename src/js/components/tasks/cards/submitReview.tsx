/* eslint-disable @typescript-eslint/camelcase */

import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import Textarea from '@salesforce/design-system-react/components/textarea';
import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  handleCancel: () => void;
  doSubmitReview: () => void;
}

const handleSuccess = () => {
  console.log('handleSuccess');
};
const handleError = () => {
  console.log('handleErr');
};

const SubmitReviewModal = ({ isOpen, handleCancel, doSubmitReview }: Props) => {
  const [status, setStatus] = useState('Approve');
  const [doDeleteOrg, setDoDeleteOrg] = useState(true);
  return (
    <Modal
      isOpen={isOpen}
      heading="Submit Review Results"
      onRequestClose={handleCancel}
      align="top"
      footer={[
        <Button key="cancel" onClick={handleCancel} label="Cancel" />,
        <Button
          key="submit"
          onClick={doSubmitReview}
          label="Submit"
          variant="brand"
        />,
      ]}
    >
      <form
        onSubmit={() => console.log('submit')}
        className="slds-form slds-p-around_medium"
      >
        <div className="slds-grid slds-wrap slds-gutters">
          <div
            className="slds-col
              slds-size_1-of-1
              slds-p-bottom_medium"
          >
            <Radio
              id="approve"
              labels={{ label: 'Approve' }}
              className="slds-form-element_stacked slds-p-left_none"
              checked={status === 'Approve'}
              onChange={() => setStatus('Approve')}
            />
            <Radio
              id="require-changes"
              labels={{ label: 'Require Changes' }}
              className="slds-form-element_stacked slds-p-left_none"
              checked={status === 'Request Changes'}
              onChange={() => setStatus('Request Changes')}
            />
            <Textarea
              id="description"
              label="Review Description"
              className="submit-textarea slds-form-element_stacked"
            />

            <Checkbox
              labels={{ label: 'Delete Review Org upon submit' }}
              checked={doDeleteOrg}
              onChange={() => setDoDeleteOrg(!doDeleteOrg)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SubmitReviewModal;
