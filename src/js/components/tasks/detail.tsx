import Button from '@salesforce/design-system-react/components/button';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '@/components/404';
import CommitList from '@/components/commits/list';
import CaptureModal from '@/components/tasks/capture';
import OrgCards from '@/components/tasks/cards';
import TaskStatusPath from '@/components/tasks/path';
import TaskStatusSteps from '@/components/tasks/steps';
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
import SubmitModal from '@/components/utils/submitModal';
import { AppState, ThunkDispatch } from '@/store';
import { refetchOrg } from '@/store/orgs/actions';
import { Org } from '@/store/orgs/reducer';
import { selectTask, selectTaskSlug } from '@/store/tasks/selectors';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { ORG_TYPES, TASK_STATUSES } from '@/utils/constants';
import { getBranchLink } from '@/utils/helpers';
import routes from '@/utils/routes';

const TaskDetail = (props: RouteComponentProps) => {
  const [fetchingChanges, setFetchingChanges] = useState(false);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

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

  const readyToSubmit = Boolean(
    task?.has_unmerged_commits && !task?.pr_is_open,
  );
  const currentlySubmitting = Boolean(task?.currently_creating_pr);
  const userIsAssignedDev = Boolean(
    user.username === task?.assigned_dev?.login,
  );
  let currentlyFetching = false;
  let currentlyCommitting = false;
  let orgHasChanges = false;
  let userIsOwner = false;
  let devOrg: Org | null | undefined;
  if (orgs) {
    devOrg = orgs[ORG_TYPES.DEV];
    orgHasChanges = Boolean(devOrg?.has_unsaved_changes);
    userIsOwner = Boolean(userIsAssignedDev && devOrg?.owner === user.id);
    currentlyFetching = Boolean(devOrg?.currently_refreshing_changes);
    currentlyCommitting = Boolean(devOrg?.currently_capturing_changes);
  }

  // When capture changes has been triggered, wait until org has been refreshed
  useEffect(() => {
    const changesFetched =
      fetchingChanges && devOrg && !devOrg.currently_refreshing_changes;

    if (changesFetched && devOrg) {
      setFetchingChanges(false);
      /* istanbul ignore else */
      if (devOrg.has_unsaved_changes && !submitModalOpen) {
        setCaptureModalOpen(true);
      }
    }
  }, [fetchingChanges, devOrg, submitModalOpen]);

  const doRefetchOrg = useCallback(
    (org: Org) => {
      dispatch(refetchOrg(org));
    },
    [dispatch],
  );

  const openSubmitModal = () => {
    setSubmitModalOpen(true);
  };

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

  const { branchLink, branchLinkText } = getBranchLink(task);
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
      {branchLink ? (
        <ExternalLink
          url={branchLink}
          showButtonIcon
          className="slds-button slds-button_outline-brand"
        >
          {branchLinkText}
        </ExternalLink>
      ) : null}
    </PageHeaderControl>
  );

  let submitButton: React.ReactNode = null;
  if (readyToSubmit) {
    const isPrimary = !(userIsOwner && orgHasChanges);
    const submitButtonText = currentlySubmitting ? (
      <LabelWithSpinner
        label={i18n.t('Submitting Task for Review…')}
        variant={isPrimary ? 'inverse' : 'base'}
      />
    ) : (
      i18n.t('Submit Task for Review')
    );
    submitButton = (
      <Button
        label={submitButtonText}
        className={classNames('slds-size_full slds-m-bottom_x-large', {
          'slds-m-left_none': !isPrimary,
        })}
        variant={isPrimary ? 'brand' : 'outline-brand'}
        onClick={openSubmitModal}
        disabled={currentlySubmitting}
      />
    );
  }

  let primaryButton: React.ReactNode = null;
  let secondaryButton: React.ReactNode = null;
  if (userIsOwner && orgHasChanges) {
    const captureButtonAction = () => {
      /* istanbul ignore else */
      if (devOrg) {
        setFetchingChanges(true);
        doRefetchOrg(devOrg);
      }
    };
    let captureButtonText: JSX.Element = i18n.t('Capture Task Changes');
    if (currentlyCommitting) {
      captureButtonText = (
        <LabelWithSpinner
          label={i18n.t('Capturing Selected Changes…')}
          variant="inverse"
        />
      );
    } else if (fetchingChanges || currentlyFetching) {
      captureButtonText = (
        <LabelWithSpinner
          label={i18n.t('Checking for Uncaptured Changes…')}
          variant="inverse"
        />
      );
    }
    primaryButton = (
      <Button
        label={captureButtonText}
        className={classNames('slds-size_full', {
          'slds-m-bottom_medium': readyToSubmit,
          'slds-m-bottom_x-large': !readyToSubmit,
        })}
        variant="brand"
        onClick={captureButtonAction}
        disabled={fetchingChanges || currentlyFetching || currentlyCommitting}
      />
    );
    if (readyToSubmit) {
      secondaryButton = submitButton;
    }
  } else if (readyToSubmit) {
    primaryButton = submitButton;
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
        sidebar={
          <>
            <TaskStatusPath task={task} />
            {orgs && task.status !== TASK_STATUSES.COMPLETED ? (
              <TaskStatusSteps task={task} orgs={orgs} />
            ) : null}
          </>
        }
      >
        {primaryButton}
        {secondaryButton}

        {orgs ? (
          <OrgCards
            orgs={orgs}
            task={task}
            projectUsers={project.github_users}
            projectUrl={routes.project_detail(repository.slug, project.slug)}
            repoUrl={repository.repo_url}
          />
        ) : (
          <SpinnerWrapper />
        )}
        {devOrg && userIsOwner && orgHasChanges && (
          <CaptureModal
            orgId={devOrg.id}
            changeset={devOrg.unsaved_changes}
            directories={devOrg.valid_target_directories}
            isOpen={captureModalOpen}
            toggleModal={setCaptureModalOpen}
          />
        )}
        {readyToSubmit && (
          <SubmitModal
            instanceId={task.id}
            instanceName={task.name}
            instanceDiffUrl={task.branch_diff_url}
            instanceType="task"
            isOpen={submitModalOpen}
            toggleModal={setSubmitModalOpen}
          />
        )}
        <CommitList commits={task.commits} />
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default TaskDetail;
