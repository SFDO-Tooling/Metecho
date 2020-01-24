import i18n from 'i18next';
import _ from 'lodash';

import { Changeset, Org } from '@/store/orgs/reducer';
import { Commit } from '@/store/tasks/reducer';
export const pluralize = (count: number, str: string) =>
  count === 1 ? str : `${str}s`;

export const getOrgStatusMsg = (org: Org) => {
  if (org.has_unsaved_changes) {
    const totalChanges = Object.values(org.unsaved_changes).flat().length;
    /* istanbul ignore else */
    if (totalChanges) {
      const statusMsgDefault = `has ${totalChanges} uncaptured ${pluralize(
        totalChanges,
        'change',
      )}`;
      return i18n.t('orgStatusMsg', statusMsgDefault, {
        count: totalChanges,
      });
    }
  }
  const msg = {
    Dev: i18n.t('up-to-date'),
    QA: i18n.t('Review in MetaShare'), // @todo this status changes per Sondra's msg)
  };
  return msg[org.org_type];
};
// todo fix to get the number of commits behind
export const getUnSyncedCommits = (commits: Commit[], org: Org) => {
  const commitIds = commits.map((commit) => commit.id);
  const orgCommitIdx = commitIds.indexOf(org.latest_commit);
  console.log(commitIds, orgCommitIdx);
  let commitsBehind;
  if (orgCommitIdx === 0) {
    console.log('up-to-date');
  }
  if (orgCommitIdx < 0) {
    // @todo is the initial commit is not in the commits list ?
    console.log('maybe up to date');
  } else {
    commitsBehind = orgCommitIdx;
  }
  return commitsBehind;
};

export const getOrgTotalChanges = (changes: Changeset) => {
  const totalChanges = Object.values(changes).flat().length;
  const changesMsgDefault = `${totalChanges} total ${pluralize(
    totalChanges,
    'change',
  )}`;
  return i18n.t('orgTotalChangesMsg', changesMsgDefault, {
    count: totalChanges,
  });
};

export const getOrgChildChanges = (count: number) => {
  const msgDefault = `${count} ${pluralize(count, 'change')}`;
  return i18n.t('orgChildChangesMsg', msgDefault, {
    count,
  });
};
