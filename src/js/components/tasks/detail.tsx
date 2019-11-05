import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '@/components/404';
import CaptureModal from '@/components/orgs/capture';
import OrgCards from '@/components/orgs/cards';
import ConnectModal from '@/components/user/connect';
import {
  DetailPageLayout,
  ExternalLink,
  getProjectLoadingOrNotFound,
  getRepositoryLoadingOrNotFound,
  getTaskLoadingOrNotFound,
  LabelWithSpinner,
  SpinnerWrapper,
  useFetchOrgsIfMissing,
  useFetchProjectIfMissing,
  useFetchRepositoryIfMissing,
  useFetchTasksIfMissing,
} from '@/components/utils';
import { AppState, ThunkDispatch } from '@/store';
import { refetchOrg } from '@/store/orgs/actions';
import { Org } from '@/store/orgs/reducer';
import { selectTask, selectTaskSlug } from '@/store/tasks/selectors';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { ORG_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

import SubmitModal from './submit';

const TaskDetail = (props: RouteComponentProps) => {
  const [fetchingChanges, setFetchingChanges] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [readyForReview, setReadyForReview] = useState(true); // true for now
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [openingReview, setOpeningReview] = useState(false);

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

  let currentlyFetching,
    currentlyCommitting,
    orgHasChanges,
    userIsOwner,
    devOrg: Org | null | undefined;
  if (orgs) {
    devOrg = orgs[ORG_TYPES.DEV];
    orgHasChanges = Boolean(devOrg && devOrg.has_unsaved_changes);
    userIsOwner = Boolean(devOrg && devOrg.owner === user.id);
    currentlyFetching = Boolean(devOrg && devOrg.currently_refreshing_changes);
    currentlyCommitting = Boolean(devOrg && devOrg.currently_capturing_changes);
  }

  // When capture changes has been triggered, wait until org has been refreshed
  useEffect(() => {
    const changesFetched =
      fetchingChanges && devOrg && !devOrg.currently_refreshing_changes;

    if (changesFetched && devOrg) {
      setFetchingChanges(false);
      /* istanbul ignore else */
      if (devOrg.has_unsaved_changes) {
        setCaptureModalOpen(true);
      }
    }
    if (openingReview && !submitModalOpen) {
      setOpeningReview(false);
    }
  }, [fetchingChanges, devOrg, submitModalOpen, openingReview]);

  const doRefetchOrg = useCallback((org: Org) => {
    dispatch(refetchOrg(org));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openConnectModal = () => {
    setConnectModalOpen(true);
  };
  const openSubmitModal = () => {
    setOpeningReview(true);
    setSubmitModalOpen(true);
  };

  let action = openConnectModal;
  if (readyForReview) {
    action = openSubmitModal;
  } else if (user.valid_token_for) {
    action = () => {
      /* istanbul ignore else */
      if (devOrg) {
        setFetchingChanges(true);
        doRefetchOrg(devOrg);
      }
    };
  }

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
        <ExternalLink
          url={task.branch_url}
          className="slds-button slds-button_outline-brand"
        >
          <Icon
            category="utility"
            name="new_window"
            size="xx-small"
            className="slds-button__icon slds-button__icon_left"
            containerClassName="slds-icon_container slds-current-color"
          />
          {i18n.t('View Branch')}
        </ExternalLink>
      ) : null}
    </PageHeaderControl>
  );

  let buttonText: string | React.ReactNode = i18n.t('Capture Task Changes');
  if (currentlyCommitting) {
    buttonText = (
      <LabelWithSpinner
        label={i18n.t('Capturing Selected Changes…')}
        variant="inverse"
      />
    );
  } else if (fetchingChanges || currentlyFetching) {
    buttonText = (
      <LabelWithSpinner
        label={i18n.t('Checking for Uncaptured Changes…')}
        variant="inverse"
      />
    );
  }
  if (readyForReview) {
    buttonText = i18n.t('Submit Task for Review');
  }

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
        {(userIsOwner && orgHasChanges) || readyForReview ? (
          <Button
            label={buttonText}
            className="slds-size_full slds-m-bottom_x-large"
            variant="brand"
            onClick={action}
            disabled={
              fetchingChanges ||
              currentlyFetching ||
              currentlyCommitting ||
              readyForReview
            }
          />
        ) : null}

        {orgs ? (
          <OrgCards orgs={orgs} task={task} project={project} />
        ) : (
          <SpinnerWrapper />
        )}
        <ConnectModal
          user={user}
          isOpen={connectModalOpen}
          toggleModal={setConnectModalOpen}
        />
        {devOrg && userIsOwner && orgHasChanges && (
          <CaptureModal
            orgId={devOrg.id}
            changeset={devOrg.unsaved_changes}
            isOpen={captureModalOpen}
            toggleModal={setCaptureModalOpen}
          />
        )}
        <SubmitModal
          isOpen={submitModalOpen}
          toggleModal={setSubmitModalOpen}
        />
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default TaskDetail;
