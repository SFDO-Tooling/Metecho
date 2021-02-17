import Card from '@salesforce/design-system-react/components/card';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import Footer from '~js/components/orgs/cards/footer';
import OrgActions from '~js/components/orgs/cards/orgActions';
import OrgIcon from '~js/components/orgs/cards/orgIcon';
import OrgInfo from '~js/components/orgs/cards/orgInfo';
import OrgSpinner from '~js/components/orgs/cards/orgSpinner';
import { useIsMounted } from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { deleteObject } from '~js/store/actions';
import { Epic } from '~js/store/epics/reducer';
import { refetchOrg, refreshOrg } from '~js/store/orgs/actions';
import { Org } from '~js/store/orgs/reducer';
import { Project } from '~js/store/projects/reducer';
import { Task } from '~js/store/tasks/reducer';
import { OBJECT_TYPES } from '~js/utils/constants';
import { getTaskCommits } from '~js/utils/helpers';

interface PlaygroundCardProps {
  org: Org;
  project?: Project;
  epic?: Epic;
  task?: Task;
  repoUrl: string;
  parentLink?: string;
}

const PlaygroundOrgCard = ({
  org,
  project,
  epic,
  task,
  repoUrl,
  parentLink,
}: PlaygroundCardProps) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);
  const isMounted = useIsMounted();

  let heading: string,
    baseCommit: string,
    typeHeading: string,
    parentName: string;
  let missingCommits = -1;
  let orgOutOfDate = false;
  // @@@
  /* istanbul ignore next */
  if (task) {
    heading = i18n.t('Task Scratch Org');
    const taskCommits = getTaskCommits(task);
    missingCommits = taskCommits.indexOf(org.latest_commit);
    // We consider an org out-of-date if it is not based on the first commit.
    orgOutOfDate = missingCommits !== 0;
    baseCommit = taskCommits[0];
    typeHeading = i18n.t('Task:');
    parentName = task.name;
  } else if (epic) {
    heading = i18n.t('Epic Scratch Org');
    baseCommit = epic.latest_sha;
    orgOutOfDate = Boolean(baseCommit && org.latest_commit !== baseCommit);
    typeHeading = i18n.t('Epic:');
    parentName = epic.name;
  } else {
    heading = i18n.t('Project Scratch Org');
    baseCommit = (project as Project).latest_sha;
    orgOutOfDate = Boolean(baseCommit && org.latest_commit !== baseCommit);
    typeHeading = i18n.t('Project:');
    parentName = (project as Project).name;
  }
  const isCreating = Boolean(org && !org.is_created);
  const isDeleting = Boolean(isDeletingOrg || org?.delete_queued_at);
  const isRefreshingChanges = Boolean(org?.currently_refreshing_changes);
  const isRefreshingOrg = Boolean(org?.currently_refreshing_org);

  const doDeleteOrg = useCallback(() => {
    setIsDeletingOrg(true);
    dispatch(
      deleteObject({
        objectType: OBJECT_TYPES.ORG,
        object: org,
      }),
    ).finally(() => {
      /* istanbul ignore else */
      if (isMounted.current) {
        setIsDeletingOrg(false);
      }
    });
  }, [dispatch, isMounted, org]);
  const doCheckForOrgChanges = useCallback(() => {
    dispatch(refetchOrg(org));
  }, [dispatch, org]);
  const doRefreshOrg = useCallback(() => {
    dispatch(refreshOrg(org));
  }, [dispatch, org]);

  /* istanbul ignore next */
  if (!(project || epic || task)) {
    return null;
  }

  return (
    <div
      className="slds-size_1-of-1
        slds-large-size_1-of-2
        slds-p-around_x-small"
    >
      <Card
        bodyClassName="slds-card__body_inner"
        heading={heading}
        icon={
          org &&
          !isCreating && (
            <OrgIcon
              orgId={org.id}
              ownedByCurrentUser
              isDeleting={isDeleting}
              isRefreshingOrg={isRefreshingOrg}
            />
          )
        }
        headerActions={
          <OrgActions
            org={org}
            type={org.org_type}
            ownedByCurrentUser
            orgOutOfDate={orgOutOfDate}
            isCreating={isCreating}
            isDeleting={isDeleting}
            isRefreshingOrg={isRefreshingOrg}
            doDeleteOrg={doDeleteOrg}
            doRefreshOrg={doRefreshOrg}
          />
        }
        footer={
          <Footer
            org={org}
            ownedByCurrentUser
            isCreating={isCreating}
            isDeleting={isDeleting}
            isRefreshingChanges={isRefreshingChanges}
            isRefreshingOrg={isRefreshingOrg}
          />
        }
      >
        <OrgInfo
          org={org}
          type={org.org_type}
          baseCommit={baseCommit}
          repoUrl={repoUrl}
          ownedByCurrentUser
          typeHeading={typeHeading}
          parentLink={parentLink}
          parentName={parentName}
          isCreating={isCreating}
          isRefreshingOrg={isRefreshingOrg}
          orgOutOfDate={orgOutOfDate}
          missingCommits={-1}
          doCheckForOrgChanges={doCheckForOrgChanges}
        />
        <OrgSpinner
          org={org}
          ownedByCurrentUser
          isDeleting={isDeleting}
          isRefreshingChanges={isRefreshingChanges}
        />
      </Card>
    </div>
  );
};

export default PlaygroundOrgCard;
