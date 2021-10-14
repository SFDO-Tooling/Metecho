import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import i18n from 'i18next';
import React from 'react';

import { useFetchIssues } from '@/js/components/utils';

interface Props {
  projectId: string;
  isOpen: boolean;
  closeIssueModal: () => void;
}

const CreateIssueModal = ({ projectId, isOpen, closeIssueModal }: Props) => {
  const { issues } = useFetchIssues({ projectId });

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
          {issues?.map((issue, idx) => (
            <Radio key={idx} label={`${issue.title}`} name="issue" />
          ))}
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

export default CreateIssueModal;
