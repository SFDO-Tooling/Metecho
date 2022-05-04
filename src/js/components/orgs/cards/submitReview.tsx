import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Textarea from '@salesforce/design-system-react/components/textarea';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  LabelWithSpinner,
  useForm,
  useFormDefaults,
  useIsMounted,
} from '@/js/components/utils';
import { REVIEW_STATUSES, ReviewStatuses } from '@/js/utils/constants';

interface Props {
  orgId?: string;
  url: string;
  reviewStatus: ReviewStatuses | '' | null;
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
  const { t } = useTranslation();
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

  // When reviewStatus or orgId changes, update default selection
  useFormDefaults({
    field: 'status',
    value: defaultStatus,
    inputs,
    setInputs,
  });
  useFormDefaults({
    field: 'delete_org',
    value: defaultDeleteOrg,
    inputs,
    setInputs,
  });

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
      heading={t('Submit Task Review')}
      size="small"
      disableClose={submittingReview}
      assistiveText={{ closeButton: t('Cancel') }}
      onRequestClose={doClose}
      footer={[
        <Button
          key="cancel"
          label={t('Cancel')}
          onClick={doClose}
          disabled={submittingReview}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            submittingReview ? (
              <LabelWithSpinner
                label={t('Submitting Review…')}
                variant="inverse"
              />
            ) : (
              t('Submit Review')
            )
          }
          variant="brand"
          onClick={handleSubmitClicked}
          disabled={submittingReview}
        />,
      ]}
    >
      <form onSubmit={doSubmit} className="slds-form slds-p-around_large">
        <RadioGroup
          assistiveText={{
            label: t('Task review status'),
            required: t('Required'),
          }}
          labels={{ error: errors.status }}
          className="slds-p-bottom_x-small"
          name="status"
          required
          onChange={handleInputChange}
        >
          <Radio
            id="approve"
            labels={{ label: t('Approve') }}
            checked={inputs.status === REVIEW_STATUSES.APPROVED}
            value={REVIEW_STATUSES.APPROVED}
            name="status"
          />
          <Radio
            id="request-changes"
            labels={{ label: t('Request changes') }}
            checked={inputs.status === REVIEW_STATUSES.CHANGES_REQUESTED}
            value={REVIEW_STATUSES.CHANGES_REQUESTED}
            name="status"
          />
        </RadioGroup>
        <Textarea
          id="notes"
          label={t('Review Description')}
          className="metecho-textarea"
          name="notes"
          value={inputs.notes}
          errorText={errors.notes}
          onChange={handleInputChange}
        />
        {orgId ? (
          <Checkbox
            id="delete-org"
            labels={{ label: 'Delete Test Org' }}
            className="slds-p-top_small"
            name="delete_org"
            checked={inputs.delete_org}
            errorText={errors.delete_org}
            onChange={handleInputChange}
          />
        ) : null}
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
