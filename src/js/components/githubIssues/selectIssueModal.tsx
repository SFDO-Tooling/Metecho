import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import i18n from 'i18next';
import React, { useState } from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  ExternalLink,
  getEpicStatus,
  getTaskStatus,
  SpinnerWrapper,
  useFetchIssues,
} from '@/js/components/utils';
import { GitHubIssue } from '@/js/store/projects/reducer';
import routes from '@/js/utils/routes';

export type issueSelectedCallback = (
  issue: GitHubIssue | null,
  type: 'epic' | 'task',
) => void;

interface Props {
  projectId: string;
  projectSlug: string;
  isOpen: false | 'epic' | 'task';
  closeIssueModal: () => void;
  issueSelected: issueSelectedCallback;
}

export const GitHubIssueLink = ({ url }: { url: string }) => (
  <ExternalLink url={url}>
    {i18n.t('View on GitHub')}
    <Icon
      category="utility"
      name="new_window"
      size="xx-small"
      className="slds-button__icon slds-button__icon_right"
      containerClassName="slds-icon_container slds-current-color"
    />
  </ExternalLink>
);

const SelectIssueModal = ({
  projectId,
  projectSlug,
  isOpen,
  closeIssueModal,
  issueSelected,
}: Props) => {
  const { issues } = useFetchIssues({
    projectId,
    isAttached: false,
    isOpen: Boolean(isOpen),
  });
  const { issues: attachedIssues } = useFetchIssues({
    projectId,
    isAttached: true,
    isOpen: Boolean(isOpen),
  });

  const [selectedIssue, setSelectedIssue] = useState<string>('');

  const closeForm = () => {
    closeIssueModal();
    setSelectedIssue('');
  };

  const changeSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIssue(event.target.value || /* istanbul ignore next */ '');
  };

  const onSubmit = (issueId: string, type: 'epic' | 'task') => {
    const issue =
      (issues && issues?.find((i) => i.id === issueId)) ||
      /* istanbul ignore next */ null;
    issueSelected(issue, type);
    closeForm();
  };

  return (
    <Modal
      isOpen={Boolean(isOpen)}
      size="small"
      heading={i18n.t('Select GitHub Issue to Develop')}
      onRequestClose={closeForm}
      assistiveText={{ closeButton: i18n.t('Cancel') }}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={closeForm} />,
        <Button
          key="createEpic"
          type="submit"
          variant={isOpen === 'epic' ? 'brand' : 'outline-brand'}
          disabled={!selectedIssue}
          label={i18n.t('Create an Epic')}
          onClick={() => onSubmit(selectedIssue, 'epic')}
        />,
        <Button
          key="createTask"
          type="submit"
          variant={isOpen === 'task' ? 'brand' : 'outline-brand'}
          disabled={!selectedIssue}
          label={i18n.t('Create a Task')}
          onClick={() => onSubmit(selectedIssue, 'task')}
        />,
      ]}
    >
      <div className="slds-is-relative slds-p-around_large">
        <p>
          <Trans i18nKey="githubIssuesHelp">
            Issues are items in GitHub’s bug and enhancement tracking system.
            Select from these open Issues, and create a Task or Epic.
          </Trans>
        </p>
        {issues && attachedIssues ? (
          <form className="slds-form slds-p-top_large">
            <div className="slds-grid slds-gutters">
              <div className="slds-col slds-size_1-of-2">
                <h2 className="slds-text-heading_small">
                  {i18n.t('Available Issues')}
                </h2>
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
                  {issues.length ? (
                    issues.map((issue, idx) => (
                      <div key={idx} className="slds-p-vertical_x-small">
                        <Radio
                          labels={{ label: `#${issue.number}: ${issue.title}` }}
                          name="github-issue"
                          value={issue.id}
                          checked={selectedIssue === issue.id}
                        />
                        <GitHubIssueLink url={issue.html_url} />
                      </div>
                    ))
                  ) : (
                    <p>{i18n.t('No Available Issues')}</p>
                  )}
                </RadioGroup>
              </div>
              <div className="slds-col slds-size_1-of-2">
                <h2 className="slds-text-heading_small">
                  {i18n.t('Attached Issues')}
                </h2>
                {attachedIssues.length ? (
                  attachedIssues.map((issue, idx) => (
                    <div key={idx} className="slds-p-vertical_x-small">
                      <Radio
                        labels={{ label: `#${issue.number}: ${issue.title}` }}
                        checked
                        value={issue.id}
                        disabled
                      />
                      {/* eslint-disable-next-line no-nested-ternary */}
                      {issue.task ? (
                        <>
                          <p>
                            {i18n.t('Task')}:{' '}
                            <Link
                              to={
                                issue.task.epic_slug
                                  ? routes.epic_task_detail(
                                      projectSlug,
                                      issue.task.epic_slug,
                                      issue.task.slug,
                                    )
                                  : routes.project_task_detail(
                                      projectSlug,
                                      issue.task.slug,
                                    )
                              }
                            >
                              {issue.task.name}
                            </Link>
                          </p>
                          <p>
                            {
                              getTaskStatus({
                                taskStatus: issue.task.status,
                                reviewStatus: issue.task.review_status,
                                reviewValid: issue.task.review_valid,
                                prIsOpen: issue.task.pr_is_open,
                              }).status
                            }
                          </p>
                        </>
                      ) : issue.epic ? (
                        <>
                          <p>
                            {i18n.t('Epic')}:{' '}
                            <Link
                              to={routes.epic_detail(
                                projectSlug,
                                issue.epic.slug,
                              )}
                            >
                              {issue.epic.name}
                            </Link>
                          </p>
                          <p>
                            {
                              getEpicStatus({ epicStatus: issue.epic.status })
                                .status
                            }
                          </p>
                        </>
                      ) : /* istanbul ignore next */ null}
                    </div>
                  ))
                ) : (
                  <p>{i18n.t('No Attached Issues')}</p>
                )}
              </div>
            </div>
          </form>
        ) : (
          // Fetching isues from API
          <div className="slds-is-relative slds-p-around_xx-large">
            <SpinnerWrapper />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SelectIssueModal;
