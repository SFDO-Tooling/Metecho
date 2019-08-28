import Button from '@salesforce/design-system-react/components/button';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '@/components/404';
import OrgsTable from '@/components/orgs/table';
import CaptureModal from '@/components/tasks/capture';
import ConnectModal from '@/components/user/connect';
import { ConnectionInfoModal } from '@/components/user/info';
import {
  DetailPageLayout,
  ExternalLink,
  getProjectLoadingOrNotFound,
  getRepositoryLoadingOrNotFound,
  getTaskLoadingOrNotFound,
  LabelWithSpinner,
  useFetchOrgsIfMissing,
  useFetchProjectIfMissing,
  useFetchRepositoryIfMissing,
  useFetchTasksIfMissing,
  useIsMounted,
} from '@/components/utils';
import { AppState, ThunkDispatch } from '@/store';
import { getChangeset, RequestChangesetSucceeded } from '@/store/orgs/actions';
import { Org } from '@/store/orgs/reducer';
import { selectTask, selectTaskSlug } from '@/store/tasks/selectors';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { OBJECT_TYPES, ORG_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

const TaskDetail = (props: RouteComponentProps) => {
  const [capturingChanges, setCapturingChanges] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [changesetID, setChangesetID] = useState('');

  const { repository, repositorySlug } = useFetchRepositoryIfMissing(props);
  const { project, projectSlug } = useFetchProjectIfMissing(repository, props);
  const dispatch = useDispatch<ThunkDispatch>();
  useFetchTasksIfMissing(project, props);
  const selectTaskWithProps = useCallback(selectTask, []);
  const selectTaskSlugWithProps = useCallback(selectTaskSlug, []);
  const task = useSelector((state: AppState) =>
    selectTaskWithProps(state, props),
  );
  const taskSlug = useSelector((state: AppState) =>
    selectTaskSlugWithProps(state, props),
  );
  const { orgs } = useFetchOrgsIfMissing(task, props);
  const user = useSelector(selectUserState) as User;
  const isMounted = useIsMounted();

  // Unsubscribe from changeset WS if leaving page
  useEffect(
    () => () => {
      if (changesetID && window.socket) {
        window.socket.unsubscribe({
          model: OBJECT_TYPES.CHANGESET,
          id: changesetID,
        });
      }
    },
    [changesetID],
  );

  const fetchChangeset = useCallback((org: Org) => {
    setCapturingChanges(true);
    setCaptureModalOpen(true);
    dispatch(getChangeset({ org }))
      .then((action: RequestChangesetSucceeded) => {
        if (action && action.payload && action.payload.changeset) {
          setChangesetID(action.payload.changeset.id);
        }
      })
      .catch(() => {
        /* istanbul ignore else */
        if (isMounted.current) {
          setCapturingChanges(false);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const repositoryLoadingOrNotFound = getRepositoryLoadingOrNotFound({
    repository,
    repositorySlug,
  });
  if (repositoryLoadingOrNotFound !== false) {
    return repositoryLoadingOrNotFound;
  }

  const projectLoadingOrNotFound = getProjectLoadingOrNotFound({
    repository,
    project,
    projectSlug,
  });

  if (projectLoadingOrNotFound !== false) {
    return projectLoadingOrNotFound;
  }

  const taskLoadingOrNotFound = getTaskLoadingOrNotFound({
    repository,
    project,
    task,
    taskSlug,
  });

  if (taskLoadingOrNotFound !== false) {
    return taskLoadingOrNotFound;
  }

  let orgHasChanges, userIsOwner, devOrg: Org | null | undefined;
  if (orgs && user) {
    devOrg = orgs[ORG_TYPES.DEV];
    orgHasChanges = devOrg && devOrg.has_changes;
    userIsOwner = devOrg && devOrg.owner === user.id;
  }

  const action = () => {
    if (user.valid_token_for) {
      if (user.is_devhub_enabled) {
        if (!devOrg) {
          return undefined;
        }
        return fetchChangeset(devOrg);
      }
      return setInfoModalOpen(true);
    }
    return setConnectModalOpen(true);
  };

  // This redundant check is used to satisfy TypeScript...
  /* istanbul ignore if */
  if (!repository || !project || !task) {
    return <FourOhFour />;
  }

  if (
    (repositorySlug && repositorySlug !== repository.slug) ||
    (projectSlug && projectSlug !== project.slug) ||
    (taskSlug && taskSlug !== task.slug)
  ) {
    // Redirect to most recent repository/project/task slug
    return (
      <Redirect
        to={routes.task_detail(repository.slug, project.slug, task.slug)}
      />
    );
  }

  const onRenderHeaderActions = () => (
    <PageHeaderControl>
      <Button
        iconCategory="utility"
        iconName="delete"
        iconPosition="left"
        label={i18n.t('Delete Task')}
        variant="text-destructive"
        disabled
      />
      {task.branch_url ? (
        <ExternalLink url={task.branch_url}>
          <Button
            iconCategory="utility"
            iconName="new_window"
            iconPosition="left"
            label={i18n.t('View Branch')}
            variant="outline-brand"
            className="slds-m-left_large"
          />
        </ExternalLink>
      ) : null}
    </PageHeaderControl>
  );

  return (
    <DocumentTitle
      title={` ${task.name} | ${project.name} | ${repository.name} | ${i18n.t(
        'MetaShare',
      )}`}
    >
      <DetailPageLayout
        title={task.name}
        description={task.description}
        repoUrl={repository.repo_url}
        breadcrumb={[
          {
            name: repository.name,
            url: routes.repository_detail(repository.slug),
          },
          {
            name: project.name,
            url: routes.project_detail(repository.slug, project.slug),
          },
          { name: task.name },
        ]}
        onRenderHeaderActions={onRenderHeaderActions}
      >
        {userIsOwner && orgHasChanges ? (
          <Button
            label={
              capturingChanges && changeset !== null ? (
                <LabelWithSpinner
                  label={i18n.t('Capturing Task Changes…')}
                  variant="inverse"
                />
              ) : (
                i18n.t('Capture Task Changes')
              )
            }
            className="slds-size_full slds-m-bottom_x-large"
            variant="brand"
            onClick={action}
            disabled={capturingChanges}
          />
        ) : null}

        {orgs ? <OrgsTable orgs={orgs} task={task.id} /> : <Spinner />}
        <ConnectModal
          user={user}
          isOpen={connectModalOpen}
          toggleModal={setConnectModalOpen}
        />
        <ConnectionInfoModal
          user={user}
          isOpen={infoModalOpen}
          toggleModal={setInfoModalOpen}
        />
        {orgs && orgs.changeset && (
          <CaptureModal
            isOpen={captureModalOpen}
            toggleModal={setCaptureModalOpen}
            toggleCapturingChanges={setCapturingChanges}
            changeset={orgs.changeset}
          />
        )}
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default TaskDetail;
