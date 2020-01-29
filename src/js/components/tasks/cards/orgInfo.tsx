import Button from '@salesforce/design-system-react/components/button';
import { format, formatDistanceToNow } from 'date-fns';
import i18n from 'i18next';
import React from 'react';

import { ExternalLink } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';
import { ORG_TYPES, OrgTypes } from '@/utils/constants';
import { getOrgStatusMsg, pluralize } from '@/utils/helpers';

const OrgInfo = ({
  org,
  type,
  ownedByCurrentUser,
  assignedToCurrentUser,
  ownedByWrongUser,
  isCreating,
  isSynced,
  orgCommitIdx,
  doCheckForOrgChanges,
}: {
  org: Org | null;
  type: OrgTypes;
  ownedByCurrentUser: boolean;
  assignedToCurrentUser: boolean;
  ownedByWrongUser: Org | null;
  isCreating: boolean;
  isSynced?: boolean;
  orgCommitIdx: number;
  doCheckForOrgChanges: () => void;
}) => {
  if (ownedByWrongUser) {
    return (
      <ul>
        <li>
          <strong>{i18n.t('Status')}:</strong> {i18n.t('owned by user')}{' '}
          <strong>{ownedByWrongUser.owner_username}</strong>
        </li>
      </ul>
    );
  }
  if (!org && !assignedToCurrentUser) {
    return (
      <ul>
        <li>
          <strong>{i18n.t('Status')}:</strong> {i18n.t('not yet created')}
        </li>
      </ul>
    );
  }
  if (!org || isCreating) {
    return null;
  }
  const canSyncDevOrg = type === ORG_TYPES.DEV && ownedByCurrentUser;
  const expiresAt = org.expires_at && new Date(org.expires_at);
  let commitStatus = null;
  if (org.latest_commit) {
    switch (type) {
      case ORG_TYPES.DEV: {
        // last commit status for dev org
        commitStatus = (
          <li>
            <strong>{i18n.t('Deployed Commit')}:</strong>{' '}
            {org.latest_commit_url ? (
              <ExternalLink url={org.latest_commit_url}>
                {org.latest_commit.substring(0, 7)}
              </ExternalLink>
            ) : (
              org.latest_commit.substring(0, 7)
            )}
          </li>
        );
        break;
      }
      case ORG_TYPES.QA: {
        // synced status for QA org
        commitStatus = isSynced ? (
          <li>
            <strong>Up to Date</strong>
          </li>
        ) : (
          <li>
            <strong>Behind Latest:</strong> {orgCommitIdx}
            {orgCommitIdx && pluralize(orgCommitIdx, 'commit')} (
            <ExternalLink url={org.latest_commit_url}>
              org comparison
            </ExternalLink>
            )
          </li>
        );
        break;
      }
    }
  }

  return (
    <ul>
      {commitStatus}
      {/* expiration date for each org */}
      {expiresAt && (
        <li>
          <strong>{i18n.t('Expires')}:</strong>{' '}
          <span title={format(expiresAt, 'PPpp')}>
            {formatDistanceToNow(expiresAt, { addSuffix: true })}
          </span>
        </li>
      )}
      {/* status for orgs */}
      <li>
        <strong>{i18n.t('Status')}:</strong> {getOrgStatusMsg(org)}
        {canSyncDevOrg && (
          <>
            {' | '}
            <Button
              label={i18n.t('check again')}
              variant="link"
              onClick={doCheckForOrgChanges}
            />
          </>
        )}
      </li>
    </ul>
  );
};

export default OrgInfo;
