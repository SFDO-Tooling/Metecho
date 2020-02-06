import Button from '@salesforce/design-system-react/components/button';
import { format, formatDistanceToNow } from 'date-fns';
import i18n from 'i18next';
import React from 'react';

import { ExternalLink } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';
import { ORG_TYPES, OrgTypes } from '@/utils/constants';
import { getOrgBehindLatestMsg, getOrgStatusMsg } from '@/utils/helpers';

const OrgInfo = ({
  org,
  type,
  repoUrl,
  taskCommits,
  ownedByCurrentUser,
  assignedToCurrentUser,
  ownedByWrongUser,
  isCreating,
  isRefreshingOrg,
  reviewOrgOutOfDate,
  missingCommits,
  doCheckForOrgChanges,
}: {
  org: Org | null;
  type: OrgTypes;
  repoUrl: string;
  taskCommits?: string[];
  ownedByCurrentUser: boolean;
  assignedToCurrentUser: boolean;
  ownedByWrongUser: Org | null;
  isCreating: boolean;
  isRefreshingOrg: boolean;
  reviewOrgOutOfDate: boolean;
  missingCommits: number;
  doCheckForOrgChanges: () => void;
}) => {
  if (ownedByWrongUser) {
    return (
      <ul>
        <li>
          <strong>{i18n.t('Status')}:</strong> {i18n.t('owned by user')}{' '}
          <strong>{ownedByWrongUser.owner_gh_username}</strong>
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
  if (!org || isCreating || isRefreshingOrg) {
    return null;
  }
  const expiresAt = org.expires_at && new Date(org.expires_at);
  let commitStatus = null;
  let compareChangesUrl = null;
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
        if (reviewOrgOutOfDate && taskCommits?.length) {
          // eslint-disable-next-line max-len
          compareChangesUrl = `${repoUrl}/compare/${org.latest_commit}...${taskCommits[0]}`;
        }
        commitStatus = reviewOrgOutOfDate ? (
          <li>
            <strong>
              {i18n.t('Behind Latest')}
              {missingCommits > 0 ? ':' : ''}
            </strong>{' '}
            {getOrgBehindLatestMsg(missingCommits)}
            {compareChangesUrl ? (
              <>
                {' '}
                (
                <ExternalLink url={compareChangesUrl}>
                  {i18n.t('view changes')}
                </ExternalLink>
                )
              </>
            ) : null}
          </li>
        ) : (
          <li>
            <strong>{i18n.t('Up to Date')}</strong>
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
      {type === ORG_TYPES.DEV && (
        <li>
          <strong>{i18n.t('Status')}:</strong> {getOrgStatusMsg(org)}
          {ownedByCurrentUser && (
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
      )}
    </ul>
  );
};

export default OrgInfo;
