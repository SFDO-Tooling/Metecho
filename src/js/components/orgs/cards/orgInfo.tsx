import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import { format, formatDistanceToNow } from 'date-fns';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import { ExternalLink } from '~js/components/utils';
import { Org } from '~js/store/orgs/reducer';
import { Task } from '~js/store/tasks/reducer';
import { ORG_TYPES, OrgTypes, REVIEW_STATUSES } from '~js/utils/constants';
import { getOrgBehindLatestMsg, getOrgStatusMsg } from '~js/utils/helpers';

const OrgInfo = ({
  org,
  type,
  task,
  repoUrl,
  baseCommit,
  ownedByCurrentUser,
  ownedByWrongUser,
  userHasPermissions,
  isCreating,
  isRefreshingOrg,
  isSubmittingReview,
  orgOutOfDate,
  missingCommits,
  doCheckForOrgChanges,
  openCaptureModal,
}: {
  org: Org | null;
  type: OrgTypes;
  task?: Task;
  repoUrl: string;
  baseCommit?: string;
  ownedByCurrentUser: boolean;
  ownedByWrongUser?: Org | null;
  userHasPermissions?: boolean;
  isCreating: boolean;
  isRefreshingOrg?: boolean;
  isSubmittingReview?: boolean;
  orgOutOfDate?: boolean;
  missingCommits: number;
  doCheckForOrgChanges?: () => void;
  openCaptureModal?: () => void;
}) => {
  if (ownedByWrongUser) {
    return (
      <ul>
        <li>
          <Trans i18nKey="orgOwnedByWrongUser">
            <strong>Status:</strong> owned by user
          </Trans>{' '}
          <strong>{ownedByWrongUser.owner_gh_username}</strong>
        </li>
      </ul>
    );
  }

  if (isCreating || isRefreshingOrg) {
    return null;
  }

  if (!(org || (type === ORG_TYPES.QA && task?.review_status))) {
    return (
      <ul>
        <li>
          <Trans i18nKey="orgNotYetCreated">
            <strong>Status:</strong> not yet created
          </Trans>
        </li>
      </ul>
    );
  }

  const expiresAt = org?.expires_at && new Date(org.expires_at);
  const reviewSubmittedAt =
    task && task.review_submitted_at && new Date(task.review_submitted_at);
  let commitStatus = null;
  let compareChangesUrl = null;
  let orgStatus = null;

  if (org?.latest_commit) {
    switch (type) {
      case ORG_TYPES.DEV: {
        // last commit status for dev org
        commitStatus = (
          <li>
            <strong>{i18n.t('Deployed Commit:')}</strong>{' '}
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
      case ORG_TYPES.QA:
      case ORG_TYPES.PLAYGROUND: {
        // synced status for orgs
        if (orgOutOfDate && baseCommit) {
          // eslint-disable-next-line max-len
          compareChangesUrl = `${repoUrl}/compare/${org.latest_commit}...${baseCommit}`;
        }
        if (orgOutOfDate) {
          commitStatus = (
            <li>
              <Icon
                category="utility"
                name="warning"
                colorVariant="warning"
                size="x-small"
                className="slds-m-bottom_xx-small"
                containerClassName="slds-m-right_xx-small"
              />
              <strong>
                {missingCommits > 0
                  ? i18n.t('Behind Latest:')
                  : i18n.t('Behind Latest')}
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
          );
        } else if (type === ORG_TYPES.QA) {
          commitStatus = (
            <li>
              <strong>{i18n.t('Up to Date')}</strong>
            </li>
          );
        }
        break;
      }
    }
  }

  switch (type) {
    case ORG_TYPES.DEV:
    case ORG_TYPES.PLAYGROUND: {
      /* istanbul ignore else */
      if (org) {
        let ignoredChangesMsg = null;
        if (
          ownedByCurrentUser &&
          org.has_ignored_changes &&
          userHasPermissions
        ) {
          ignoredChangesMsg = (
            <>
              {' ('}
              <Button
                label={`${org.total_ignored_changes} ${i18n.t('ignored')}`}
                variant="link"
                onClick={openCaptureModal}
              />
              {')'}
            </>
          );
        }
        orgStatus = (
          <>
            {getOrgStatusMsg(org)}
            {ownedByCurrentUser && (
              <>
                {ignoredChangesMsg}
                {' | '}
                <Button
                  label={i18n.t('check again')}
                  variant="link"
                  onClick={doCheckForOrgChanges}
                />
              </>
            )}
          </>
        );
      }
      break;
    }
    case ORG_TYPES.QA: {
      const isWaitingForReview = org && task?.pr_is_open;
      if (isSubmittingReview) {
        orgStatus = i18n.t('Submitting review…');
      } else if (task?.review_status) {
        const isApproved = task?.review_status === REVIEW_STATUSES.APPROVED;
        const isChangesRequested =
          task?.review_status === REVIEW_STATUSES.CHANGES_REQUESTED;
        const isValid = task?.review_valid;
        if (isApproved) {
          if (isValid) {
            orgStatus = (
              <span className="slds-text-color_success">
                {i18n.t('Approved')}
              </span>
            );
          } else {
            orgStatus = i18n.t('Review out of date');
          }
        } else {
          /* istanbul ignore else */
          // eslint-disable-next-line no-lonely-if
          if (isChangesRequested) {
            orgStatus = i18n.t('Changes requested');
          }
        }
        /* istanbul ignore else */
        if (reviewSubmittedAt) {
          orgStatus = (
            <>
              {orgStatus}
              {` | ${i18n.t('Submitted review')} ${formatDistanceToNow(
                reviewSubmittedAt,
                {
                  addSuffix: true,
                },
              )}`}
            </>
          );
        }
      } else if (isWaitingForReview) {
        orgStatus = i18n.t('Pending review');
      }
      break;
    }
  }

  /* istanbul ignore next */
  return org || orgStatus ? (
    <ul>
      {org?.description_rendered ? (
        <li>
          <div
            className="markdown slds-text-longform"
            // This description is pre-cleaned by the API
            dangerouslySetInnerHTML={{
              __html: org.description_rendered,
            }}
          />
        </li>
      ) : null}
      {commitStatus}
      {/* expiration date for each org */}
      {expiresAt && (
        <li>
          <strong>{i18n.t('Expires:')}</strong>{' '}
          <span title={format(expiresAt, 'PPpp')}>
            {formatDistanceToNow(expiresAt, { addSuffix: true })}
          </span>
        </li>
      )}
      {orgStatus ? (
        <li>
          <strong>{i18n.t('Status:')}</strong> {orgStatus}
        </li>
      ) : null}
    </ul>
  ) : null;
};

export default OrgInfo;
