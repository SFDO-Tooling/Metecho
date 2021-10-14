import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import i18n from 'i18next';
import React, { useEffect, useRef, useState } from 'react';

import { LabelWithSpinner, useFetchIssues } from '@/js/components/utils';

interface Props {
  projectId: string;
  isOpen: boolean;
  closeIssueModal: () => void;
}

const createIssueModal = ({ projectId, isOpen, closeIssueModal }: Props) => {
  const issues = useFetchIssues(projectId);

  const closeForm = () => {
    closeIssueModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      heading={i18n.t('Select Github Issue to Develop')}
      onRequestClose={closeForm}
      assistiveText={{ closeButton: i18n.t('Cancel') }}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={closeForm} />,
        <Button
          key="submit"
          type="submit"
          variant="brand"
          label={i18n.t('Create Epic')}
        />,
        <Button
          key="submit"
          type="submit"
          variant="outline-brand"
          label={i18n.t('Create Task')}
        />,
      ]}
    >
      <form
        className="slds-form slds-p-around_large"
        data-form="create-epic-branch"
      >
        <RadioGroup
          assistiveText={{
            label: i18n.t('Epic Branch'),
            required: i18n.t('Required'),
          }}
          className="slds-form-element_stacked slds-p-left_none"
          name="epic-branch"
          required
          // onChange={handleBranchCheckboxChange}
        >
          {issues.map((issue) => (
            <Radio label={`${issue.name}`} name="issue" />
          ))}
          <Radio
            id="epic-branch-existing"
            labels={{ label: i18n.t('Use existing GitHub branch') }}
            // checked={fromBranchChecked}
            name="epic-branch"
            value="existing"
          />
        </RadioGroup>
        {/* Clicking hidden button allows for native browser form validation */}
        <button
          // ref={submitButton}
          type="submit"
          style={{ display: 'none' }}
          // disabled={isSaving}
        />
      </form>
    </Modal>
  );
};

export default createIssueModal;
