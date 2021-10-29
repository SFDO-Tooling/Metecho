import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import i18n from 'i18next';
import React, { useState } from 'react';

import {
  ExternalLink,
  LabelWithSpinner,
  useFetchIssues,
} from '@/js/components/utils';
import { GithubIssue } from '@/js/store/projects/reducer';

export type createEpicOrTaskCallback = (
  issue: GithubIssue | null,
  createEpicfromIssue: boolean,
) => void;

interface Props {
  projectId: string;
  isOpen: boolean;
  closeIssueModal: () => void;
  createEpicOrTask: createEpicOrTaskCallback;
}

const CreateIssueModal = ({
  projectId,
  isOpen,
  closeIssueModal,
  createEpicOrTask,
}: Props) => {
  const { issues } = useFetchIssues({ projectId, isAttached: false, isOpen });
  const { issues: attachedIssues } = useFetchIssues({
    projectId,
    isOpen,
    isAttached: true,
  });

  const [selectedIssue, setSelectedIssue] = useState<string>('');

  const closeForm = () => {
    closeIssueModal();
    setSelectedIssue('');
  };

  const changeSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIssue(event.target.value || '');
  };

  const onSubmit = (issueId: string, createEpic: boolean) => {
    const issue = (issues && issues?.find((i) => i.id === issueId)) || null;
    createEpicOrTask(issue, createEpic);
  };

  return (
    <Modal
      isOpen={isOpen}
      size="medium"
      heading={i18n.t('Select Github Issue to Develop')}
      onRequestClose={closeForm}
      assistiveText={{ closeButton: i18n.t('Cancel') }}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={closeForm} />,
        <Button
          key="createEpic"
          type="submit"
          variant="brand"
          disabled={!selectedIssue}
          label={i18n.t('Create Epic')}
          onClick={() => onSubmit(selectedIssue, true)}
        />,
        <Button
          key="createTask"
          type="submit"
          variant="outline-brand"
          disabled={!selectedIssue}
          label={i18n.t('Create Task')}
          onClick={() => onSubmit(selectedIssue, false)}
        />,
      ]}
    >
      <p className="slds-align_absolute-center">
        {i18n.t(
          "Issues is Github's bug and enhancement tracker system. Select from these open Issues, and create a Task or Epic.",
        )}
      </p>
      <form
        className="slds-form slds-p-around_large"
        data-form="attach-github-issue"
      >
        <div className="slds-grid slds-gutters">
          <div className="slds-col slds-size_1-of-2">
            <h2 className="slds-text-heading_medium">Available Issues</h2>
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
                  <div key={idx}>
                    <Radio
                      key={idx}
                      labels={{ label: `#${issue.number}: ${issue.title}` }}
                      name="github-issue"
                      value={issue.id}
                      checked={selectedIssue === issue.id}
                    />
                    <ExternalLink url={issue.html_url} showButtonIcon={true}>
                      View on Github
                    </ExternalLink>
                  </div>
                ))
              ) : (
                <LabelWithSpinner
                  label={i18n.t('Loading Issues...')}
                  variant="inverse"
                />
              )}
            </RadioGroup>
          </div>
          <div className="slds-col slds-size_1-of-2">
            <h2 className="slds-text-heading_medium">Attached Issues</h2>
            <RadioGroup
              assistiveText={{
                label: i18n.t('Attached Issues'),
              }}
              className="slds-form-element_stacked slds-p-left_none"
              name="attached-github-issue"
            >
              {attachedIssues && attachedIssues?.length > 0 ? (
                attachedIssues?.map((issue, idx) => (
                  <Radio
                    key={idx}
                    labels={{ label: `#${issue.number}: ${issue.title}` }}
                    name="attached-github-issue"
                    checked
                    value={issue.id}
                    disabled
                  />
                ))
              ) : (
                <p>{i18n.t(`No attached Issues`)}</p>
              )}
            </RadioGroup>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateIssueModal;
