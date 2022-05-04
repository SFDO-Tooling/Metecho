import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { OrgTypeTracker } from '@/js/components/orgs/taskOrgCards';
import Steps from '@/js/components/steps';
import { Step } from '@/js/components/steps/stepsItem';
import { AppState } from '@/js/store';
import { OrgsByParent } from '@/js/store/orgs/reducer';
import { selectProjectCollaborator } from '@/js/store/projects/selectors';
import { Task } from '@/js/store/tasks/reducer';
import { User } from '@/js/store/user/reducer';
import { ORG_TYPES, REVIEW_STATUSES } from '@/js/utils/constants';
import { getTaskCommits } from '@/js/utils/helpers';

interface TaskStatusStepsProps {
  task: Task;
  orgs: OrgsByParent;
  user: User;
  projectId: string;
  hasPermissions: boolean;
  isCreatingOrg: OrgTypeTracker;
  handleAction: (step: Step) => void;
}

const TaskStatusSteps = ({
  task,
  orgs,
  user,
  projectId,
  hasPermissions,
  isCreatingOrg,
  handleAction,
}: TaskStatusStepsProps) => {
  const { t } = useTranslation();
  const devUser = useSelector((state: AppState) =>
    selectProjectCollaborator(state, projectId, task.assigned_dev),
  );
  const qaUser = useSelector((state: AppState) =>
    selectProjectCollaborator(state, projectId, task.assigned_qa),
  );
  const hasDev = Boolean(task.assigned_dev);
  const hasTester = Boolean(task.assigned_qa);
  const hasReviewApproved =
    task.review_valid && task.review_status === REVIEW_STATUSES.APPROVED;
  const hasReviewRejected =
    task.review_valid &&
    task.review_status === REVIEW_STATUSES.CHANGES_REQUESTED;
  const readyForReview = task.has_unmerged_commits && task.pr_is_open;
  const hasValidCommits = task.has_unmerged_commits && !hasReviewRejected;
  const devOrg = orgs[ORG_TYPES.DEV];
  const testOrg = orgs[ORG_TYPES.QA];
  const hasDevOrg = Boolean(devOrg?.is_created);
  const hasTestOrg = Boolean(testOrg?.is_created);
  const userIsAssignedDev = Boolean(user.github_id === task?.assigned_dev);
  const userIsAssignedTester = Boolean(user.github_id === task?.assigned_qa);
  const userIsDevOrgOwner = Boolean(
    userIsAssignedDev && devOrg?.is_created && devOrg?.owner === user.id,
  );
  const userIsTestOrgOwner = Boolean(
    userIsAssignedTester && testOrg?.is_created && testOrg?.owner === user.id,
  );
  const taskIsSubmitting = Boolean(task?.currently_creating_pr);
  const devOrgFetching = Boolean(devOrg?.currently_refreshing_changes);
  const devOrgCommitting = Boolean(devOrg?.currently_capturing_changes);
  const devOrgIsCreating = Boolean(
    isCreatingOrg[ORG_TYPES.DEV] || (devOrg && !devOrg.is_created),
  );
  const devOrgIsDeleting = Boolean(devOrg?.delete_queued_at);
  const devOrgIsReassigning = Boolean(devOrg?.currently_reassigning_user);
  const testOrgIsCreating = Boolean(
    isCreatingOrg[ORG_TYPES.QA] || (testOrg && !testOrg.is_created),
  );
  const testOrgIsDeleting = Boolean(testOrg?.delete_queued_at);
  const testOrgIsRefreshing = Boolean(testOrg?.currently_refreshing_org);
  const testOrgIsSubmittingReview = Boolean(task?.currently_submitting_review);
  const taskCommits = getTaskCommits(task);
  const testOrgOutOfDate =
    hasTestOrg && taskCommits.indexOf(testOrg?.latest_commit || '') !== 0;

  const devOrgLoading =
    devOrgIsCreating ||
    devOrgIsDeleting ||
    devOrgFetching ||
    devOrgIsReassigning ||
    devOrgCommitting;
  const testOrgLoading =
    testOrgIsCreating ||
    testOrgIsDeleting ||
    testOrgIsRefreshing ||
    testOrgIsSubmittingReview;

  let retrieveChangesLabel = t('Retrieve changes from Dev Org');
  if (devOrgFetching) {
    retrieveChangesLabel = t('Checking for Unretrieved Changes…');
  }
  if (devOrgCommitting) {
    retrieveChangesLabel = t('Retrieving changes from Dev Org…');
  }

  const steps: Step[] = [
    {
      label: t('Assign a Developer'),
      active: !hasDev,
      // Even if no dev is currently assigned,
      // consider this complete if there are commits and no rejected review
      complete: hasDev || hasValidCommits,
      assignee: null,
      action: hasPermissions ? 'assign-dev' : undefined,
    },
    {
      label: devOrgIsCreating
        ? t('Creating a Dev Org…')
        : t('Create a Dev Org'),
      active: hasDev && !hasDevOrg,
      // Even if no dev is currently assigned and there's no Dev Org,
      // consider this complete if there are commits and no rejected review
      complete: (hasDev && hasDevOrg) || hasValidCommits,
      assignee: devUser,
      action:
        userIsAssignedDev && !devOrgLoading ? 'create-dev-org' : undefined,
    },
    {
      label: t('Make changes in Dev Org'),
      // Active if we have an assigned Dev, a Dev Org, and the Dev Org has no
      // unsaved changes
      active: hasDev && hasDevOrg && !devOrg?.has_unsaved_changes,
      // Complete if the Dev Org has unsaved changes or we have commits
      // (without rejected review)
      complete: Boolean(devOrg?.has_unsaved_changes || hasValidCommits),
      assignee: devUser,
      link:
        devOrg && userIsDevOrgOwner && !devOrgLoading
          ? window.api_urls.scratch_org_redirect(devOrg.id)
          : undefined,
    },
    {
      label: retrieveChangesLabel,
      // Active if we have an assigned Dev and a Dev Org with unsaved changes
      active: hasDev && hasDevOrg && Boolean(devOrg?.has_unsaved_changes),
      // Complete if we have commits (without rejected review)
      complete: hasValidCommits,
      assignee: devUser,
      action:
        devOrgLoading || !hasPermissions || !userIsDevOrgOwner
          ? undefined
          : 'retrieve-changes',
    },
    {
      label: taskIsSubmitting
        ? t('Submitting changes for testing…')
        : t('Submit changes for testing'),
      active: task.has_unmerged_commits && !task.pr_is_open,
      complete: task.pr_is_open,
      assignee: null,
      action:
        taskIsSubmitting || !hasPermissions ? undefined : 'submit-changes',
    },
    {
      label: t('Assign a Tester'),
      active: readyForReview && !hasTester,
      complete: hasTester || task.review_valid,
      assignee: null,
      action: hasPermissions ? 'assign-qa' : undefined,
    },
    {
      label: testOrgIsCreating
        ? t('Creating a Test Org…')
        : t('Create a Test Org'),
      active: readyForReview && hasTester && !hasTestOrg,
      complete: (hasTester && hasTestOrg) || task.review_valid,
      hidden: testOrgOutOfDate,
      assignee: qaUser,
      action:
        userIsAssignedTester && !testOrgLoading ? 'create-qa-org' : undefined,
    },
    {
      label: testOrgIsRefreshing
        ? t('Refreshing Test Org…')
        : t('Refresh Test Org'),
      active: testOrgOutOfDate,
      complete: false,
      hidden: !testOrgOutOfDate,
      assignee: qaUser,
      action:
        userIsTestOrgOwner && !testOrgLoading ? 'refresh-test-org' : undefined,
    },
    {
      label: t('Test changes in Test Org'),
      active: readyForReview && hasTestOrg && !testOrg?.has_been_visited,
      complete:
        Boolean(hasTestOrg && testOrg?.has_been_visited) || task.review_valid,
      assignee: qaUser,
      link:
        testOrg && userIsTestOrgOwner && !testOrgLoading
          ? window.api_urls.scratch_org_redirect(testOrg.id)
          : undefined,
    },
    {
      label: testOrgIsSubmittingReview
        ? t('Submitting a review…')
        : t('Submit a review'),
      // Active if Task PR is still open, a up-to-date Test Org exists,
      // and there isn't already a valid review.
      active:
        readyForReview &&
        Boolean(hasTestOrg && testOrg?.has_been_visited) &&
        !testOrgOutOfDate &&
        !task.review_valid,
      complete: task.review_valid,
      assignee: qaUser,
      action:
        userIsAssignedTester && !testOrgIsSubmittingReview
          ? 'submit-review'
          : undefined,
    },
    {
      label: t('Merge pull request on GitHub'),
      active: readyForReview && hasReviewApproved,
      complete: false,
      assignee: null,
      link: task.pr_url,
    },
  ];

  return (
    <Steps
      steps={steps}
      title={t('Next Steps for this Task')}
      handleAction={handleAction}
    />
  );
};

export default TaskStatusSteps;
