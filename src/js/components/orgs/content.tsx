import Button from '@salesforce/design-system-react/components/button';
import { format, formatDistanceToNow } from 'date-fns';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { Org } from 'src/js/store/orgs/reducer';

import { ExternalLink } from '@/components/utils';
import { getOrgStatusMsg, getQASyncStatus } from '@/utils/helpers';

interface OrgContentsProps {
  org: Org;
  action: () => void;
  ownedByCurrentUser: boolean;
}
const OrgContents = ({ org, action, ownedByCurrentUser }: OrgContentsProps) => {
  const expiresAt = org.expires_at && new Date(org.expires_at);
  const canSyncDevOrg = ownedByCurrentUser && org.org_type === 'Dev';
  /* displays sync status for dev org*/
  const devSyncStatus = (
    <>
      <li>
        {' '}
        <strong>{i18n.t('Deployed Commit')}:</strong>{' '}
        {org.latest_commit_url ? (
          <ExternalLink url={org.latest_commit_url}>
            {org.latest_commit.substring(0, 7)}
          </ExternalLink>
        ) : (
          org.latest_commit.substring(0, 7)
        )}
      </li>
    </>
  );
  /* displays status for remote for dev org*/
  const statusMsg = (
    <li>
      <strong>{i18n.t('Status')}:</strong> {getOrgStatusMsg(org)}
      {canSyncDevOrg && (
        <>
          {' | '}
          <Button
            label={i18n.t('check again')}
            variant="link"
            onClick={action}
          />
        </>
      )}
    </li>
  );
  /* displays sync status for dev org*/
  const qaSyncStatus = <strong>{getQASyncStatus()}</strong>;
  // org expiration date shows for both types//
  const expiration = expiresAt && (
    <li>
      <strong>{i18n.t('Expires')}:</strong>{' '}
      <span title={format(expiresAt, 'PPpp')}>
        {formatDistanceToNow(expiresAt, {
          addSuffix: true,
        })}
      </span>
    </li>
  );
  const renderedContents = {
    Dev: [devSyncStatus, expiration, statusMsg],
    QA: [qaSyncStatus, expiration, statusMsg],
  };
  return [renderedContents[org.org_type]];
};

export default OrgContents;
