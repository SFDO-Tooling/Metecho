import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useRef, useState } from 'react';
import { Trans } from 'react-i18next';

import {
  ExternalLink,
  LabelWithSpinner,
  useForm,
  useIsMounted,
} from '@/components/utils';
import { OBJECT_TYPES } from '@/utils/constants';

interface Props {
  taskId: string;
  taskName: string;
  isOpen: boolean;
  toggleModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const SubmitModal = ({ taskId, taskName, isOpen, toggleModal }: Props) => {
  const [submittingReview, setSubmittingReview] = useState(false);
  const isMounted = useIsMounted();
  const submitButton = useRef<HTMLButtonElement | null>(null);

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setSubmittingReview(false);
      toggleModal(false);
    }
  };

  /* istanbul ignore next */
  const handleError = () => {
    if (isMounted.current) {
      setSubmittingReview(false);
    }
  };

  const {
    inputs,
    errors,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useForm({
    /* eslint-disable @typescript-eslint/camelcase */
    fields: {
      title: taskName,
      critical_changes: '',
      additional_changes: '',
      issues: '',
      notes: '',
    },
    /* eslint-enable @typescript-eslint/camelcase */
    objectType: OBJECT_TYPES.TASK_PR,
    url: window.api_urls.task_create_pr(taskId),
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const handleSubmitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };

  const handleClose = () => {
    toggleModal(false);
    resetForm();
  };

  const submitTask = (e: React.FormEvent<HTMLFormElement>) => {
    setSubmittingReview(true);
    handleSubmit(e);
  };

  return (
    <Modal
      isOpen={isOpen}
      size="medium"
      disableClose={submittingReview}
      heading={i18n.t('Submit this task for review')}
      footer={[
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          onClick={handleClose}
          disabled={submittingReview}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            submittingReview ? (
              <LabelWithSpinner
                label={i18n.t('Submitting Task for Review…')}
                variant="inverse"
              />
            ) : (
              i18n.t('Submit Task for Review')
            )
          }
          variant="brand"
          onClick={handleSubmitClicked}
          disabled={submittingReview}
        />,
      ]}
      onRequestClose={handleClose}
    >
      <form className="slds-form slds-p-around_large" onSubmit={submitTask}>
        <div className="slds-grid slds-wrap slds-gutters">
          <div
            className="slds-col
              slds-size_1-of-1
              slds-medium-size_6-of-12
              slds-large-size_8-of-12"
          >
            <div className="slds-form-element__help slds-p-bottom_small">
              <Trans i18nKey="releaseNotesInfo">
                Details entered will be used when publishing release notes.
                Please use Markdown to format your notes.
              </Trans>
            </div>
            <Input
              id="task-title"
              label={i18n.t('Title')}
              className="slds-form-element_stacked slds-p-left_none"
              name="title"
              value={inputs.title}
              required
              aria-required
              maxLength="50"
              errorText={errors.title}
              onChange={handleInputChange}
            />
            <Textarea
              id="task-critical-changes"
              label={i18n.t(
                'Describe any critical changes which might impact existing functionality',
              )}
              className="task-submit-textarea
                slds-form-element_stacked
                slds-p-left_none"
              name="critical_changes"
              value={inputs.critical_changes}
              errorText={errors.critical_changes}
              onChange={handleInputChange}
            />
            <Textarea
              id="task-additional-changes"
              label={i18n.t(
                'Describe additional changes including instructions for users for any post-upgrade tasks',
              )}
              className="task-submit-textarea
                slds-form-element_stacked
                slds-p-left_none"
              name="additional_changes"
              value={inputs.additional_changes}
              errorText={errors.additional_changes}
              onChange={handleInputChange}
            />
            <Textarea
              id="task-issues"
              label={i18n.t(
                'Which, if any, issues were closed (including issue #number)',
              )}
              placeholder={i18n.t(
                '- Fixes #102\n- Resolves #100\n- This release closes #101',
              )}
              className="task-submit-textarea
                slds-form-element_stacked
                slds-p-left_none"
              name="issues"
              value={inputs.issues}
              errorText={errors.issues}
              onChange={handleInputChange}
            />
            <Textarea
              id="task-notes"
              label={i18n.t('Developer notes')}
              className="task-submit-textarea
                slds-form-element_stacked
                slds-p-left_none"
              name="notes"
              value={inputs.notes}
              errorText={errors.notes}
              onChange={handleInputChange}
            />
          </div>
          <div
            className="slds-col
              slds-size_1-of-1
              slds-medium-size_6-of-12
              slds-large-size_4-of-12"
          >
            <Button
              iconCategory="utility"
              iconName="new_window"
              iconPosition="left"
              label={i18n.t('Compare Changes')}
              variant="outline-brand"
              disabled
            />
            <h3 className="slds-m-vertical_medium slds-text-heading_small">
              {i18n.t('Markdown Guide')}
            </h3>
            <div className="markdown-block slds-m-vertical_medium">
              <pre>## {i18n.t('Heading')}</pre>
              <pre>### {i18n.t('Subheading')}</pre>
            </div>
            <div className="markdown-block slds-m-vertical_medium">
              <pre>*{i18n.t('This becomes italic text')}*</pre>
              <pre>**{i18n.t('This becomes bold text')}**</pre>
            </div>
            <div className="markdown-block slds-m-vertical_medium">
              <pre>- {i18n.t('Unordered list with asterisk or hyphen')}</pre>
              {/* prettier-ignore */}
              <pre>  - {i18n.t('Double space to nest list items')}</pre>
            </div>
            <div className="markdown-block slds-m-vertical_medium">
              <pre>- [x] {i18n.t('Completed checklist item')}</pre>
              <pre>- [ ] {i18n.t('Incomplete checklist item')}</pre>
            </div>
            <p className="slds-m-top_medium">
              <b>{i18n.t('Example')}</b>
            </p>
            <pre>## {i18n.t('Stops gogobob from refreshing')}</pre>
            <pre>{i18n.t('This includes')}:</pre>
            <div className="markdown-block">
              <pre>- {i18n.t('Renders incomplete bobble as such')}</pre>
              <pre>- {i18n.t('Prevents fire from building')}</pre>
              {/* prettier-ignore */}
              <pre>  - {i18n.t('Prevents fire duplication')}</pre>
              {/* prettier-ignore */}
              <pre>  - {i18n.t('Prevents fire spread')}</pre>
            </div>
            <div className="slds-m-vertical_x-large">---</div>
            <p>
              <Trans i18nKey="markdownGuide">
                For more options, view this{' '}
                <ExternalLink url="https://guides.github.com/features/mastering-markdown/">
                  Markdown Guide
                </ExternalLink>
                .
              </Trans>
            </p>
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

export default SubmitModal;
