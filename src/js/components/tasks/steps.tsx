import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';

import { GitHubUserAvatar } from '@/components/user/githubUser';
import { OrgsByTask } from '@/store/orgs/reducer';
import { Task } from '@/store/tasks/reducer';
import { GitHubUser } from '@/store/user/reducer';
import { ORG_TYPES, REVIEW_STATUSES } from '@/utils/constants';
import { getTaskCommits } from '@/utils/helpers';

interface TaskStatusPathProps {
  task: Task;
  orgs: OrgsByTask;
}

const TaskStatusSteps = ({ task, orgs }: TaskStatusPathProps) => {
  const hasDev = Boolean(task.assigned_dev);
  const hasTester = Boolean(task.assigned_qa);
  const hasReviewApproved =
    task.review_valid && task.review_status === REVIEW_STATUSES.APPROVED;
  const hasReviewRejected =
    task.review_valid &&
    task.review_status === REVIEW_STATUSES.CHANGES_REQUESTED;
  const readyForReview = task.has_unmerged_commits && task.pr_is_open;
  const devOrg = orgs[ORG_TYPES.DEV];
  const testOrg = orgs[ORG_TYPES.QA];
  const hasDevOrg = Boolean(devOrg?.is_created);
  const hasTestOrg = Boolean(testOrg?.is_created);
  const hasValidCommits = task.has_unmerged_commits && !hasReviewRejected;
  const taskCommits = getTaskCommits(task);
  const testOrgOutOfDate =
    hasTestOrg && taskCommits.indexOf(testOrg?.latest_commit || '') !== 0;

  const steps = [
    {
      label: `${i18n.t('Assign a Developer')}`,
      visible: true,
      active: !hasDev,
      // Even if no dev is currently assigned,
      // consider this complete if there are commits and no rejected review
      complete: hasDev || hasValidCommits,
      assignee: null,
    },
    {
      label: `${i18n.t('Create a Scratch Org for development')}`,
      visible: true,
      active: hasDev && !hasDevOrg,
      // Even if no dev is currently assigned and there's no Dev Org,
      // consider this complete if there are commits and no rejected review
      complete: (hasDev && hasDevOrg) || hasValidCommits,
      assignee: task.assigned_dev,
    },
    {
      label: `${i18n.t('Make changes in Dev Org')}`,
      visible: true,
      // Active if we have an assigned Dev, a Dev Org, and the Dev Org has no
      // unsaved changes
      active: hasDev && hasDevOrg && !devOrg?.has_unsaved_changes,
      // Complete if the Dev Org has unsaved changes or we have commits
      // (without rejected review)
      complete: Boolean(devOrg?.has_unsaved_changes || hasValidCommits),
      assignee: task.assigned_dev,
    },
    {
      label: `${i18n.t('Retrieve changes from Dev Org')}`,
      visible: true,
      // Active if we have an assigned Dev and a Dev Org with unsaved changes
      active: hasDev && hasDevOrg && Boolean(devOrg?.has_unsaved_changes),
      // Complete if we have commits (without rejected review)
      complete: hasValidCommits,
      assignee: task.assigned_dev,
    },
    {
      label: `${i18n.t('Submit changes for testing')}`,
      visible: true,
      active: task.has_unmerged_commits && !task.pr_is_open,
      complete: task.pr_is_open,
      assignee: null,
    },
    {
      label: `${i18n.t('Assign a Tester')}`,
      visible: true,
      active: readyForReview && !hasTester,
      complete: hasTester || task.review_valid,
      assignee: null,
    },
    {
      label: `${i18n.t('Create a Scratch Org for testing')}`,
      visible: !testOrgOutOfDate,
      active: readyForReview && hasTester && !hasTestOrg,
      complete: (hasTester && hasTestOrg) || task.review_valid,
      assignee: task.assigned_qa,
    },
    {
      label: `${i18n.t('Refresh Test Org')}`,
      visible: testOrgOutOfDate,
      active: testOrgOutOfDate,
      complete: false,
      assignee: task.assigned_qa,
    },
    {
      label: `${i18n.t('Test changes in Test Org')}`,
      visible: true,
      active: readyForReview && hasTestOrg && !testOrg?.has_been_visited,
      complete:
        Boolean(hasTestOrg && testOrg?.has_been_visited) || task.review_valid,
      assignee: task.assigned_qa,
    },
    {
      label: `${i18n.t('Submit a review')}`,
      visible: true,
      // Active if Task PR is still open, a up-to-date Test Org exists,
      // and there isn't already a valid review.
      active:
        readyForReview &&
        Boolean(hasTestOrg && testOrg?.has_been_visited) &&
        !testOrgOutOfDate &&
        !task.review_valid,
      complete: task.review_valid,
      assignee: task.assigned_qa,
    },
    {
      label: `${i18n.t('Merge pull request on GitHub')}`,
      visible: true,
      active: readyForReview && hasReviewApproved,
      complete: false,
      assignee: null,
    },
  ];

  return (
    <>
      <h3 className="slds-text-heading_medium slds-m-bottom_small">
        {i18n.t('Next Steps')}
      </h3>

      <div className="slds-progress slds-progress_vertical">
        <ol className="slds-progress__list">
          {steps
            .filter((step) => step.visible)
            .map((step, idx) => {
              const isActive = step.active && !step.complete;
              const hasAssignee = Boolean(step.assignee && !step.complete);
              return (
                <li
                  key={idx}
                  className={classNames('slds-progress__item', {
                    'slds-is-completed': step.complete,
                    'slds-is-active': isActive,
                  })}
                >
                  {hasAssignee && (
                    <GitHubUserAvatar
                      user={step.assignee as GitHubUser}
                      size="x-small"
                    />
                  )}
                  {step.complete ? (
                    <Icon
                      category="utility"
                      name="success"
                      size="x-small"
                      containerClassName={classNames(
                        'slds-icon_container',
                        'slds-icon-utility-success',
                        'slds-progress__marker',
                        'slds-progress__marker_icon',
                        {
                          'slds-m-left_x-large': !hasAssignee,
                          'slds-m-left_small': hasAssignee,
                        },
                      )}
                      title={i18n.t('Complete')}
                      assistiveText={{ label: i18n.t('Complete') }}
                    />
                  ) : (
                    <div
                      className={classNames('slds-progress__marker', {
                        'slds-m-left_x-large': !hasAssignee,
                        'slds-m-left_small': hasAssignee,
                      })}
                    >
                      {isActive && (
                        <span className="slds-assistive-text">
                          {i18n.t('Active')}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className="slds-progress__item_content
                      slds-grid
                      slds-grid_align-spread"
                  >
                    {step.label}
                  </div>
                </li>
              );
            })}
        </ol>
      </div>
    </>
  );
};

export default TaskStatusSteps;
