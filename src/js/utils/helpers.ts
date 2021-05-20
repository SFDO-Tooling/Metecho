import i18n from 'i18next';
import { cloneDeep, intersection, mergeWith, union, without } from 'lodash';

import { Epic } from '~js/store/epics/reducer';
import { Changeset, Org } from '~js/store/orgs/reducer';
import { Task } from '~js/store/tasks/reducer';
import { OBJECT_TYPES, TASK_STATUSES } from '~js/utils/constants';

export const pluralize = (count: number, str: string) =>
  count === 1 ? str : `${str}s`;

export const getOrgStatusMsg = (org: Org) => {
  const totalChanges = org.total_unsaved_changes - org.total_ignored_changes;
  if (totalChanges > 0) {
    const statusMsgDefault = `${totalChanges} unretrieved ${pluralize(
      totalChanges,
      'change',
    )}`;
    return i18n.t('orgStatusMsg', statusMsgDefault, {
      count: totalChanges,
    });
  }
  return i18n.t('up to date');
};

export const getOrgBehindLatestMsg = (
  missingCommits: number,
  titleCase?: boolean,
) => {
  /* istanbul ignore else */
  if (missingCommits > 0) {
    const msgDefault = titleCase
      ? `${missingCommits} ${pluralize(missingCommits, 'Commit')}`
      : `${missingCommits} ${pluralize(missingCommits, 'commit')}`;
    const name = titleCase ? 'orgBehindTitle' : 'orgBehindMsg';
    return i18n.t(name, msgDefault, {
      count: missingCommits,
    });
  }
  return '';
};

export const getBranchLink = (object: Task | Epic, type: 'epic' | 'task') => {
  let branchLink, branchLinkText, popoverHeading, popoverBody, popoverKey;

  if (object.pr_url) {
    branchLink = object.pr_url;
    branchLinkText = i18n.t('View Pull Request');
    popoverKey =
      type === OBJECT_TYPES.EPIC
        ? i18n.t('tourViewEpicPullRequest')
        : i18n.t('tourViewTaskPullRequest');
    popoverHeading = i18n.t('View GitHub Pull Request');
    popoverBody =
      type === OBJECT_TYPES.EPIC
        ? i18n.t(
            'Select this button to leave Metecho and access the Epic’s branch on GitHub. A “branch” in Git is a way to create a new feature or make a modification to existing software but not affect the main “trunk” of the Project. A branch is created in GitHub when a new Epic or Task is created in Metecho.',
          )
        : i18n.t(
            'Select this button to leave Metecho and access the Task’s pull request on GitHub. A pull request in GitHub is a way to ask the maintainers of the Project to pull in some code. A pull request is created for a Task branch in GitHub when the Developer submits changes for testing in Metecho.',
          );
  } else if (object.has_unmerged_commits && object.branch_diff_url) {
    branchLink = object.branch_diff_url;
    branchLinkText = i18n.t('View Changes');
    popoverHeading = i18n.t('View Changes');
  } else if (object.branch_url) {
    branchLink = object.branch_url;
    branchLinkText = i18n.t('View Branch');
    popoverKey =
      type === OBJECT_TYPES.EPIC
        ? i18n.t('tourViewEpicBranch')
        : i18n.t('tourViewTaskBranch');
    popoverHeading =
      type === OBJECT_TYPES.EPIC
        ? i18n.t('View GitHub Branch for Epic')
        : i18n.t('View GitHub Branch for Task');
    popoverBody =
      type === OBJECT_TYPES.EPIC
        ? i18n.t(
            'Select this button to leave Metecho and access the Epic’s branch on GitHub. A “branch” in Git is a way to create a new feature or make a modification to existing software but not affect the main “trunk” of the Project. A branch is created in GitHub when a new Epic or Task is created in Metecho.',
          )
        : i18n.t(
            'Select this button to leave Metecho and access the Task’s branch on GitHub. A “branch” in Git is a way to create a new feature or make a modification to existing software but not affect the main “trunk” of the Project. A branch is created in GitHub when a new Epic or Task is created in Metecho.',
          );
  }
  return {
    branchLink,
    branchLinkText,
    popoverHeading,
    popoverBody,
    popoverKey,
  };
};

export const getTaskCommits = (task: Task) => {
  // Get list of commit sha/ids, newest to oldest, ending with origin commit.
  // We consider an org out-of-date if it is not based on the first commit.
  const taskCommits = task.commits.map((c) => c.id);
  if (task.origin_sha) {
    taskCommits.push(task.origin_sha);
  }
  return taskCommits;
};

export const getPercentage = (complete: number, total: number) =>
  Math.floor((complete / total) * 100) || 0;

export const getCompletedTasks = (tasks: Task[]) =>
  tasks.filter((task) => task.status === TASK_STATUSES.COMPLETED);

export const splitChangeset = (changes: Changeset, comparison: Changeset) => {
  const remaining: Changeset = {};
  const removed: Changeset = {};
  for (const groupName of Object.keys(changes)) {
    if (comparison[groupName]?.length) {
      const toRemove = intersection(changes[groupName], comparison[groupName]);
      const filtered = without(changes[groupName], ...toRemove);
      if (filtered.length) {
        remaining[groupName] = filtered;
      }
      if (toRemove.length) {
        removed[groupName] = toRemove;
      }
    } else {
      remaining[groupName] = [...changes[groupName]];
    }
  }
  return { remaining, removed };
};

export const mergeChangesets = (original: Changeset, adding: Changeset) =>
  mergeWith(cloneDeep(original), adding, (objVal, srcVal) =>
    union(objVal, srcVal),
  );
