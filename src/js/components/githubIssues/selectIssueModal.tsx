import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import ResyncIssuesButton from '@/js/components/githubIssues/resyncIssuesButton';
import Search from '@/js/components/githubIssues/search';
import {
  ExternalLink,
  getEpicStatus,
  getTaskStatus,
  SpinnerWrapper,
  useFetchIssues,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { updateObject } from '@/js/store/actions';
import { Epic } from '@/js/store/epics/reducer';
import {
  GitHubIssue,
  IssueEpic,
  IssueTask,
} from '@/js/store/githubIssues/reducer';
import { Task } from '@/js/store/tasks/reducer';
import { OBJECT_TYPES } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

export type issueSelectedCallback = (
  issue: GitHubIssue | null,
  type: 'epic' | 'task',
) => void;

interface Props {
  projectId: string;
  projectSlug: string;
  issueCount: number;
  isOpen: boolean | 'epic' | 'task';
  closeIssueModal: () => void;
  issueSelected?: issueSelectedCallback;
  attachingToTask?: Task;
  attachingToEpic?: Epic;
  currentlyResyncing: boolean;
}

export const GitHubIssueLink = ({ url }: { url: string }) => {
  const { t } = useTranslation();

  return (
    <ExternalLink url={url}>
      {t('View on GitHub')}
      <Icon
        category="utility"
        name="new_window"
        size="xx-small"
        className="slds-button__icon
          slds-button__icon_right
          slds-m-bottom_xx-small"
        containerClassName="slds-icon_container slds-current-color"
      />
    </ExternalLink>
  );
};

const TaskStatus = ({ task }: { task: IssueTask }) => {
  const { status, icon } = getTaskStatus({
    taskStatus: task.status,
    reviewStatus: task.review_status,
    reviewValid: task.review_valid,
    prIsOpen: task.pr_is_open,
  });

  return (
    <span
      className="slds-m-left_x-small v-align-center icon-text-block"
      title={status}
    >
      {icon}
    </span>
  );
};

const EpicStatus = ({ epic }: { epic: IssueEpic }) => {
  const { status, icon } = getEpicStatus({ epicStatus: epic.status });

  return (
    <span
      className="slds-m-left_x-small v-align-center icon-text-block"
      title={status}
    >
      {icon}
    </span>
  );
};

const SelectIssueModal = ({
  projectId,
  projectSlug,
  issueCount,
  isOpen,
  closeIssueModal,
  issueSelected,
  attachingToTask,
  attachingToEpic,
  currentlyResyncing,
}: Props) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const { t } = useTranslation();
  const [search, setSearch] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<string>('');

  const { issues, currentlyFetching, count, clearIssues } = useFetchIssues({
    projectId,
    isAttached: false,
    isOpen: Boolean(isOpen),
    currentlyResyncing,
    search,
  });
  const {
    issues: attachedIssues,
    currentlyFetching: currentlyFetchingAttached,
    count: countAttached,
    clearIssues: clearAttachedIssues,
  } = useFetchIssues({
    projectId,
    isAttached: true,
    isOpen: Boolean(isOpen),
    currentlyResyncing,
    search,
  });

  const closeForm = () => {
    closeIssueModal();
    setSelectedIssue('');
    setSearch('');
    clearIssues();
    clearAttachedIssues();
  };

  const searchIssues = (searchterm: string) => {
    const trimmed = searchterm.trim();
    setSearch(trimmed);
  };

  const changeSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIssue(event.target.value || /* istanbul ignore next */ '');
  };

  const onSubmit = (issueId: string, type: 'epic' | 'task') => {
    const issue =
      (issues && issues?.find((i) => i.id === issueId)) ||
      /* istanbul ignore next */ null;
    issueSelected?.(issue, type);
    closeForm();
  };

  const onAttach = () => {
    /* istanbul ignore else */
    if (selectedIssue) {
      if (attachingToEpic) {
        dispatch(
          updateObject({
            objectType: OBJECT_TYPES.EPIC,
            url: window.api_urls.epic_detail(attachingToEpic.id),
            data: { issue: selectedIssue },
            patch: true,
          }),
        );
      } else {
        /* istanbul ignore else */
        // eslint-disable-next-line no-lonely-if
        if (attachingToTask) {
          dispatch(
            updateObject({
              objectType: OBJECT_TYPES.TASK,
              url: window.api_urls.task_detail(attachingToTask.id),
              data: { issue: selectedIssue },
              patch: true,
            }),
          );
        }
      }
    }
    closeForm();
  };

  return (
    <Modal
      isOpen={Boolean(isOpen)}
      size="small"
      heading={t('Select GitHub Issue to Develop')}
      onRequestClose={closeForm}
      assistiveText={{ closeButton: t('Cancel') }}
      footer={
        attachingToTask || attachingToEpic
          ? [
              <Button key="cancel" label={t('Cancel')} onClick={closeForm} />,
              <Button
                key="attach"
                type="submit"
                variant="brand"
                disabled={!selectedIssue}
                label={
                  attachingToTask
                    ? t('Attach Issue to Task')
                    : t('Attach Issue to Epic')
                }
                onClick={onAttach}
              />,
            ]
          : [
              <Button key="cancel" label={t('Cancel')} onClick={closeForm} />,
              <Button
                key="createEpic"
                type="submit"
                variant={isOpen === 'epic' ? 'brand' : 'outline-brand'}
                disabled={!selectedIssue}
                label={t('Create an Epic')}
                onClick={() => onSubmit(selectedIssue, 'epic')}
              />,
              <Button
                key="createTask"
                type="submit"
                variant={isOpen === 'task' ? 'brand' : 'outline-brand'}
                disabled={!selectedIssue}
                label={t('Create a Task')}
                onClick={() => onSubmit(selectedIssue, 'task')}
              />,
            ]
      }
    >
      <div className="slds-is-relative slds-p-around_large">
        <div
          className="slds-grid
            slds-grid_vertical-align-start
            slds-wrap"
        >
          <div
            className="slds-grid
              slds-wrap
              slds-shrink
              slds-p-right_medium
              slds-p-bottom_small
              slds-size_1-of-1
              slds-medium-size_5-of-7"
          >
            <p>
              <Trans i18nKey="githubIssuesHelp">
                Issues are items in GitHub’s bug and enhancement tracking
                system. Select from these open Issues, and create a Task or
                Epic. If you don’t see the Issue you’re looking for, try
                re-syncing the list of Issues.
              </Trans>
            </p>
          </div>
          <div
            className="slds-grid
              slds-size_1-of-1
              slds-medium-size_2-of-7
              slds-m-bottom_small"
          >
            <ResyncIssuesButton
              projectId={projectId}
              isRefreshing={currentlyResyncing}
              hasFetched={Boolean(issues && attachedIssues)}
              noIssues={Boolean(!issues?.length && !attachedIssues?.length)}
            />
          </div>
        </div>
        <div
          className="search-container
            slds-size_1-of-1
            slds-medium-size_5-of-7
            slds-p-right_medium
            slds-p-bottom_large"
        >
          <Search
            searchIssues={searchIssues}
            count={count + countAttached}
            total={issueCount}
            hasSearch={Boolean(search)}
          />
        </div>
        <form className="slds-form">
          <div className="slds-grid slds-gutters slds-wrap">
            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
              <h2 className="slds-text-heading_small">
                {t('Available Issues')}
              </h2>
              <RadioGroup
                assistiveText={{
                  label: t('Available Issues'),
                  required: t('Required'),
                }}
                className="slds-form-element_stacked slds-p-left_none"
                name="github-issue"
                required
                onChange={changeSelection}
              >
                {issues?.length ? (
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
                  <p className="slds-p-top_x-small">
                    {t('No Available Issues')}
                  </p>
                )}
              </RadioGroup>
            </div>
            <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
              <h2 className="slds-text-heading_small">
                {t('Attached Issues')}
              </h2>
              {attachedIssues?.length ? (
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
                        <div>
                          {t('Task:')}{' '}
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
                          <TaskStatus task={issue.task} />
                        </div>
                      </>
                    ) : issue.epic ? (
                      <>
                        <div>
                          {t('Epic:')}{' '}
                          <Link
                            to={routes.epic_detail(
                              projectSlug,
                              issue.epic.slug,
                            )}
                          >
                            {issue.epic.name}
                          </Link>
                          <EpicStatus epic={issue.epic} />
                        </div>
                      </>
                    ) : /* istanbul ignore next */ null}
                  </div>
                ))
              ) : (
                <p className="slds-p-top_x-small">{t('No Attached Issues')}</p>
              )}
            </div>
          </div>
        </form>
        {(currentlyResyncing ||
          currentlyFetching ||
          currentlyFetchingAttached) && <SpinnerWrapper />}
      </div>
    </Modal>
  );
};

export default SelectIssueModal;
