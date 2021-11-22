import { t } from 'i18next';
import { cloneDeep, intersection, mergeWith, union, without } from 'lodash';
import React from 'react';
import { Trans } from 'react-i18next';

import TourPopover from '@/js/components/tour/popover';
import { Epic } from '@/js/store/epics/reducer';
import { Changeset, Org } from '@/js/store/orgs/reducer';
import { Task } from '@/js/store/tasks/reducer';
import {
  EPIC_STATUSES,
  OBJECT_TYPES,
  TASK_STATUSES,
} from '@/js/utils/constants';

export const pluralize = (count: number, str: string) =>
  count === 1 ? str : `${str}s`;

export const getOrgStatusMsg = (org: Org) => {
  const totalChanges = org.total_unsaved_changes - org.total_ignored_changes;
  if (totalChanges > 0) {
    const statusMsgDefault = `${totalChanges} unretrieved ${pluralize(
      totalChanges,
      'change',
    )}`;
    return t('orgStatusMsg', statusMsgDefault, {
      count: totalChanges,
    });
  }
  return t('up to date');
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
    return t(name, msgDefault, {
      count: missingCommits,
    });
  }
  return '';
};

export const getBranchLink = (object: Task | Epic, type: 'epic' | 'task') => {
  let branchLink, branchLinkText;
  let popover = null;

  if (
    object.pr_url &&
    (object.pr_is_open ||
      [TASK_STATUSES.COMPLETED, EPIC_STATUSES.MERGED].includes(
        object.status as any,
      ))
  ) {
    branchLink = object.pr_url;
    branchLinkText = t('View Pull Request');
    const heading = t('View GitHub pull request');
    popover =
      type === OBJECT_TYPES.EPIC ? (
        <TourPopover
          id="tour-epic-pull-request"
          align="bottom right"
          heading={heading}
          body={
            <Trans i18nKey="tourViewEpicPullRequest">
              Select this button to leave Metecho and access the Epic’s pull
              request on GitHub. A “pull request” is a way to ask the
              maintainers of the Project to incorporate some changes. A pull
              request is created for an Epic branch in GitHub when the Developer
              submits an Epic for review in Metecho.
            </Trans>
          }
        />
      ) : (
        <TourPopover
          id="tour-task-pull-request"
          align="bottom right"
          heading={heading}
          body={
            <Trans i18nKey="tourViewTaskPullRequest">
              Select this button to leave Metecho and access the Task’s pull
              request on GitHub. A “pull request” is a way to ask the
              maintainers of the Project to incorporate some changes. A pull
              request is created for a Task branch in GitHub when the Developer
              submits changes for testing in Metecho.
            </Trans>
          }
        />
      );
  } else if (object.has_unmerged_commits && object.branch_diff_url) {
    branchLink = object.branch_diff_url;
    branchLinkText = t('View Changes');
    const heading = t('View changes on GitHub');
    popover =
      type === OBJECT_TYPES.EPIC ? (
        <TourPopover
          id="tour-epic-changes"
          align="bottom right"
          heading={heading}
          body={
            <Trans i18nKey="tourViewEpicChanges">
              Select this button to leave Metecho and view the retrieved changes
              for this Epic that have not yet been added to the Project. Compare
              the changes to the current state of the Project.
            </Trans>
          }
        />
      ) : (
        <TourPopover
          id="tour-task-changes"
          align="bottom right"
          heading={heading}
          body={
            <Trans i18nKey="tourViewTaskChanges">
              Select this button to leave Metecho and view the retrieved changes
              or “commits” for this Task that have not yet been added to the
              Project. Compare the changes to the current state of the Project.
            </Trans>
          }
        />
      );
  } else if (object.branch_url) {
    branchLink = object.branch_url;
    branchLinkText = t('View Branch');
    popover =
      type === OBJECT_TYPES.EPIC ? (
        <TourPopover
          id="tour-epic-branch"
          align="bottom right"
          heading={t('View GitHub branch for this Epic')}
          body={
            <Trans i18nKey="tourViewEpicBranch">
              Select this button to leave Metecho and access the Epic’s branch
              on GitHub. A “branch” is a way to create a new feature or make a
              modification to existing software without affecting the main
              “trunk” of the Project. A branch is created in GitHub when a new
              Epic or Task is created in Metecho.
            </Trans>
          }
        />
      ) : (
        <TourPopover
          id="tour-task-branch"
          align="bottom right"
          heading={t('View GitHub branch for this Task')}
          body={
            <Trans i18nKey="tourViewTaskBranch">
              Select this button to leave Metecho and access the Task’s branch
              on GitHub. A “branch” is a way to create a new feature or make a
              modification to existing software without affecting the main
              “trunk” of the Project. A branch is created in GitHub when a new
              Epic or Task is created in Metecho.
            </Trans>
          }
        />
      );
  }
  return {
    branchLink,
    branchLinkText,
    popover,
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
