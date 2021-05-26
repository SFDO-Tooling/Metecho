import i18n from 'i18next';
import { cloneDeep, intersection, mergeWith, union, without } from 'lodash';

import { Epic } from '~js/store/epics/reducer';
import { Changeset, Org } from '~js/store/orgs/reducer';
import { Task } from '~js/store/tasks/reducer';
import { EPIC_STATUSES, TASK_STATUSES } from '~js/utils/constants';

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

export const getBranchLink = (object: Task | Epic) => {
  let branchLink, branchLinkText;
  if (
    object.pr_url &&
    (object.pr_is_open ||
      [TASK_STATUSES.COMPLETED, EPIC_STATUSES.MERGED].includes(
        object.status as any,
      ))
  ) {
    branchLink = object.pr_url;
    branchLinkText = i18n.t('View Pull Request');
  } else if (object.has_unmerged_commits && object.branch_diff_url) {
    branchLink = object.branch_diff_url;
    branchLinkText = i18n.t('View Changes');
  } else if (object.branch_url) {
    branchLink = object.branch_url;
    branchLinkText = i18n.t('View Branch');
  }
  return { branchLink, branchLinkText };
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
