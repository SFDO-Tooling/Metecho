import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import i18n from 'i18next';
import React, { useState } from 'react';

import { LabelWithSpinner, useFetchIssues } from '@/js/components/utils';

interface Props {
  projectId: string;
  isOpen: boolean;
  closeIssueModal: () => void;
}

const CreateIssueModal = ({ projectId, isOpen, closeIssueModal }: Props) => {
  const { issues } = useFetchIssues({ projectId, isAttached: false, isOpen });
  const { issues: attachedIssues } = useFetchIssues({
    projectId,
    isOpen,
    isAttached: true,
  });

  const [selectedIssue, setSelectedIssue] = useState('');
  const [enableButton, setEnableButton] = useState(false);

  const closeForm = () => {
    closeIssueModal();
    setSelectedIssue('');
    setEnableButton(false);
  };

  // const submitForm = (issue) => {
  //   // createEpicModalOpen();
  //   // passIdToModal(issue);
  // };

  const changeSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnableButton(true);
    setSelectedIssue(event.target.value);
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
          key="createEpic"
          type="submit"
          variant="brand"
          // disabled={enableButton}
          label={i18n.t('Create Epic')}
          // onSubmit={submitForm(selectedIssue)}
        />,
        <Button
          key="createTask"
          type="submit"
          variant="outline-brand"
          // disabled={enableButton}
          label={i18n.t('Create Task')}
          // onSubmit={submitForm(selectedIssue)}
        />,
      ]}
    >
      <p className="slds-align_absolute-center slds-m-bottom_small">
        {i18n.t(
          "Issues is Github's bug and enhancement tracker system. Select from these open Issues, and create a Task or Epic.",
        )}
      </p>
      <form
        className="slds-form slds-p-around_large"
        data-form="attach-github-issue"
      >
        <RadioGroup
          assistiveText={{
            label: i18n.t('Available Issues'),
            required: i18n.t('Required'),
          }}
          className="slds-form-element_stacked slds-p-left_none"
          name="github-issue"
          required
          onChange={changeSelection}
        >
          {issues ? (
            issues.map((issue, idx) => (
              <Radio
                key={idx}
                label={issue.title}
                name="github-issue"
                value={issue.id}
                checked={selectedIssue === issue.id}
              />
            ))
          ) : (
            <LabelWithSpinner
              label={i18n.t('Loading Issues...')}
              variant="inverse"
            />
          )}
        </RadioGroup>
        <RadioGroup
          assistiveText={{
            label: i18n.t('Attached Issues'),
          }}
          className="slds-form-element_stacked slds-p-left_none"
          name="attached-github-issue"
        >
          {attachedIssues?.map((issue, idx) => (
            <Radio
              key={idx}
              label={issue.title}
              name="attached-github-issue"
              checked
              value={issue.id}
              disabled
            />
          ))}
        </RadioGroup>
        {/* Clicking hidden button allows for native browser form validation */}
        <button type="submit" style={{ display: 'none' }} />
      </form>
    </Modal>
  );
};

export default CreateIssueModal;
