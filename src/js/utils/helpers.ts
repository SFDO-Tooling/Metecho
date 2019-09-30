import i18n from 'i18next';

import { Changeset, Org } from '@/store/orgs/reducer';

export const pluralize = (count: number, str: string) =>
  count === 1 ? str : `${str}s`;

export const getOrgStatusMsg = (org: Org) => {
  if (org.unsaved_changes) {
    const totalChanges = Object.values(org.unsaved_changes).flat().length;
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
  return i18n.t('up-to-date');
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
