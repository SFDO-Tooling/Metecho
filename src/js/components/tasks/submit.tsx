import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useState } from 'react';
import { Trans } from 'react-i18next';

import { LabelWithSpinner, useForm } from '@/components/utils';
import { OBJECT_TYPES } from '@/utils/constants';

interface Props {
  isOpen: boolean;
  toggleModal: React.Dispatch<React.SetStateAction<boolean>>;
}
const SubmitModal = ({ isOpen, toggleModal }: Props) => {
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSuccess = () => {
    setSubmittingReview(false);
    toggleModal(false);
  };
  const {
    inputs,
    errors,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: {
      criticalChanges: '',
      changes: '',
      issuesClosed: '',
      devNotes: '',
    },
    objectType: OBJECT_TYPES.PULL_REQUEST, //@@@ todo for now
    onSuccess: handleSuccess,
  });
  const handleCancel = () => {
    resetForm();
    toggleModal(false);
  };
  const submitTask = (e: React.FormEvent<HTMLFormElement>) => {
    setSubmittingReview(true);
    setTimeout(() => {
      handleSubmit(e);
    }, 1500);
  };
  const handleClose = () => {
    resetForm();
    toggleModal(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      heading={i18n.t('Submit this task for review')}
      size="medium"
      disableClose={submittingReview}
      footer={[
        <Button
          key="back"
          label={i18n.t('Cancel Submit')}
          onClick={handleCancel}
          disbaled={submittingReview}
        />,
        <Button
          key="submit"
          label={
            submittingReview ? (
              <LabelWithSpinner
                label={i18n.t('Submitting Task…')}
                variant="inverse"
              />
            ) : (
              i18n.t('Submit Task for Review')
            )
          }
          variant="brand"
          onClick={submitTask}
        />,
      ]}
      onRequestClose={handleClose}
    >
      <form className="slds-p-around_large" onSubmit={submitTask}>
        <div className="slds-grid slds-wrap slds-gutters">
          <div className="slds-col slds-size_1-of-1 slds-medium-size_6-of-12 slds-large-size_8-of-12">
            <p className="slds-m-bottom_medium">
              <Trans i18nKey="releaseNotesInfo">
                Details entered will be used when publishing release notes.
                Please use markdown to format your notes.
              </Trans>
            </p>
            <Textarea
              id="task-critical-changes"
              label={i18n.t(
                'Describe any critical changes which might impact existing functionality',
              )}
              name="criticalChanges"
              value={inputs.criticalChanges}
              onChange={handleInputChange}
              className="task-submit-textarea"
            />
            <Textarea
              id="task-changes"
              label={i18n.t(
                'Describe additional changes including instructions for users for any post-upgrade tasks.',
              )}
              name="changes"
              value={inputs.changes}
              onChange={handleInputChange}
              className="task-submit-textarea"
            />
            <Textarea
              id="task-issues-closed"
              label={i18n.t(
                'Which, if any, issues were closed (including issue #number)',
              )}
              name="issuesClosed"
              value={inputs.issuesClosed}
              onChange={handleInputChange}
              className="task-submit-textarea"
            />
            <Textarea
              id="task-dev-notes"
              label={i18n.t('Developer notes')}
              name="devNotes"
              value={inputs.devNotes}
              onChange={handleInputChange}
              className="task-submit-textarea"
            />
          </div>
          <div className="slds-col slds-size_1-of-1 slds-medium-size_6-of-12 slds-large-size_4-of-12">
            <Button
              iconCategory="utility"
              iconName="new_window"
              iconPosition="left"
              label={i18n.t('Compare Changes')}
              variant="outline-brand"
              disabled
            />
            <h3 className=" slds-m-vertical_medium slds-text-heading_small">
              {i18n.t('Markdown Guide')}
            </h3>
            <div className="markdown-block slds-m-vertical_medium">
              <pre>{i18n.t('# Heading level 1')}</pre>
              <pre>{i18n.t('## Heading level 2')}</pre>
            </div>
            <div className="markdown-block slds-m-vertical_medium">
              <pre>*{i18n.t('This becomes italic text')}*</pre>
              <pre>**{i18n.t('This becomes bold text')}**</pre>
            </div>
            <div className="markdown-block slds-m-vertical_medium">
              <pre>-{i18n.t('Unordered list asterisk or minus')}</pre>
              {/* prettier-ignore */}
              <pre>  - {i18n.t('Incomplete checklist item')}</pre>
            </div>
            <p className="slds-m-top_medium">
              <b>{i18n.t('Sample Response')}</b>
            </p>
            <pre>## {i18n.t('Stops goggob from refreshing')}</pre>
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
              {i18n.t('For more options, view')}{' '}
              <a>{i18n.t('Markdown Guide')}</a>
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SubmitModal;
