import Button from '@salesforce/design-system-react/components/button';
import { format, formatDistanceToNow } from 'date-fns';
import i18n from 'i18next';
import React from 'react';

import { ExternalLink } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';
import { ORG_TYPES, OrgTypes } from '@/utils/constants';
import { getOrgStatusMsg } from '@/utils/helpers';

const OrgInfo = ({
  org,
  type,
  ownedByCurrentUser,
  assignedToCurrentUser,
  ownedByWrongUser,
  isCreating,
  doCheckForOrgChanges,
}: {
  org: Org | null;
  type: OrgTypes;
  ownedByCurrentUser: boolean;
  assignedToCurrentUser: boolean;
  ownedByWrongUser: Org | null;
  isCreating: boolean;
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
  if (!org || isCreating) {
    return null;
  }
  const expiresAt = org.expires_at && new Date(org.expires_at);
  return (
    <ul>
      {org.latest_commit && (
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
      )}
      {expiresAt && (
        <li>
          <strong>{i18n.t('Expires')}:</strong>{' '}
          <span title={format(expiresAt, 'PPpp')}>
            {formatDistanceToNow(expiresAt, { addSuffix: true })}
          </span>
        </li>
      )}
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
