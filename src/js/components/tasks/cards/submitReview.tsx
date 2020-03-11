import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useEffect, useRef, useState } from 'react';

import { LabelWithSpinner, useForm, useIsMounted } from '@/components/utils';
import { REVIEW_STATUSES, ReviewStatuses } from '@/utils/constants';

interface Props {
  orgId?: string;
  url: string;
  reviewStatus: ReviewStatuses | null;
  isOpen: boolean;
  handleClose: () => void;
}

const SubmitReviewModal = ({
  orgId,
  url,
  reviewStatus,
  isOpen,
  handleClose,
}: Props) => {
  const [submittingReview, setSubmittingReview] = useState(false);
  const isMounted = useIsMounted();
  const submitButton = useRef<HTMLButtonElement | null>(null);

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setSubmittingReview(false);
      handleClose();
    }
  };

  /* istanbul ignore next */
  const handleError = () => {
    if (isMounted.current) {
      setSubmittingReview(false);
    }
  };

  const defaultStatus = reviewStatus || REVIEW_STATUSES.APPROVED;
  const defaultDeleteOrg = Boolean(orgId);

  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: {
      notes: '',
      status: defaultStatus,
      delete_org: defaultDeleteOrg,
    },
    url,
    additionalData: {
      org: orgId || null,
    },
    onSuccess: handleSuccess,
    onError: handleError,
    shouldSubscribeToObject: false,
  });

  // When reviewStatus changes, update default selection
  const defaultStatusRef = useRef(defaultStatus);
  useEffect(() => {
    const prevDefaultStatus = defaultStatusRef.current;
    if (defaultStatus !== prevDefaultStatus) {
      setInputs({ ...inputs, status: defaultStatus });
      defaultStatusRef.current = defaultStatus;
    }
  }, [defaultStatus, inputs, setInputs]);

  // When orgId changes, update default selection
  const defaultDeleteOrgRef = useRef(defaultDeleteOrg);
  useEffect(() => {
    const prevDefaultDeleteOrg = defaultDeleteOrgRef.current;
    if (defaultDeleteOrg !== prevDefaultDeleteOrg) {
      setInputs({ ...inputs, delete_org: defaultDeleteOrg });
      defaultDeleteOrgRef.current = defaultDeleteOrg;
    }
  }, [defaultDeleteOrg, inputs, setInputs]);

  const handleSubmitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };

  const doSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setSubmittingReview(true);
    handleSubmit(e);
  };

  const doClose = () => {
    handleClose();
    resetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      heading={i18n.t('Submit Task Review')}
      size="small"
      disableClose={submittingReview}
      onRequestClose={doClose}
      footer={[
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          onClick={doClose}
          disabled={submittingReview}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            submittingReview ? (
              <LabelWithSpinner
                label={i18n.t('Submitting Review…')}
                variant="inverse"
              />
            ) : (
              i18n.t('Submit Review')
            )
          }
          variant="brand"
          onClick={handleSubmitClicked}
          disabled={submittingReview}
        />,
      ]}
    >
      <form onSubmit={doSubmit} className="slds-form slds-p-around_large">
        <div className="slds-grid slds-wrap slds-gutters">
          <div className="slds-col slds-size_1-of-1">
            <RadioGroup
              assistiveText={{
                label: i18n.t('Task review status'),
                required: i18n.t('Required'),
              }}
              labels={{ error: errors.status }}
              className="slds-p-bottom_x-small"
              name="status"
              required
              onChange={handleInputChange}
            >
              <Radio
                id="approve"
                labels={{ label: i18n.t('Approve') }}
                checked={inputs.status === REVIEW_STATUSES.APPROVED}
                value={REVIEW_STATUSES.APPROVED}
                name="status"
              />
              <Radio
                id="request-changes"
                labels={{ label: i18n.t('Request changes') }}
                checked={inputs.status === REVIEW_STATUSES.CHANGES_REQUESTED}
                value={REVIEW_STATUSES.CHANGES_REQUESTED}
                name="status"
              />
            </RadioGroup>
            <Textarea
              id="notes"
              label={i18n.t('Review Description')}
              className="ms-textarea"
              name="notes"
              value={inputs.notes}
              errorText={errors.notes}
              onChange={handleInputChange}
            />
            {orgId ? (
              <Checkbox
                id="delete-org"
                labels={{ label: 'Delete Review Org' }}
                className="slds-p-top_small"
                name="delete_org"
                checked={inputs.delete_org}
                errorText={errors.delete_org}
                onChange={handleInputChange}
              />
            ) : null}
          </div>
        </div>
        {/* Clicking hidden button allows for native browser form validation */}
        <button
          ref={submitButton}
          type="submit"
          style={{ display: 'none' }}
          disabled={submittingReview}
        />
      </form>
    </Modal>
  );
};

export default SubmitReviewModal;
