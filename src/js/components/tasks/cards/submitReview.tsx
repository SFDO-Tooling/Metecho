/* eslint-disable @typescript-eslint/camelcase */

import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import Textarea from '@salesforce/design-system-react/components/textarea';
import React, { useState } from 'react';

import { Review } from '@/store/tasks/reducer';
import { REVIEW_STATUS } from '@/utils/constants';

interface Props {
  isOpen: boolean;
  handleCancel: () => void;
  submitReview: (data: Review) => void;
}

const SubmitReviewModal = ({ isOpen, handleCancel, submitReview }: Props) => {
  const [status, setStatus] = useState('APPROVE');
  const [doDeleteOrg, setDoDeleteOrg] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const data = {
      notes,
      status,
      delete_org_on_submit: doDeleteOrg,
    };
    submitReview(data);
    // reset();
  };
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
          onClick={handleSubmit}
          label="Submit"
          variant="brand"
        />,
      ]}
    >
      <form onSubmit={handleSubmit} className="slds-form slds-p-around_medium">
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
              checked={status === 'APPROVE'}
              onChange={() => setStatus('APPROVE')}
            />
            <Radio
              id="require-changes"
              labels={{ label: 'Request Changes' }}
              className="slds-form-element_stacked slds-p-left_none"
              checked={status === 'REQUEST_CHANGES'}
              onChange={() => setStatus('REQUEST_CHANGES')}
            />
            <Textarea
              id="description"
              label="Review Description"
              className="submit-textarea slds-form-element_stacked"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
