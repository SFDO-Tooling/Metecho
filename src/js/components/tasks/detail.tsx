// For some reason Eslint is getting confused about `useCallback` being used
// after conditional variable declarations (e.g. `"foo" || "bar"`)...
/* eslint-disable react-hooks/rules-of-hooks */

import Button from '@salesforce/design-system-react/components/button';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import classNames from 'classnames';
import { addMinutes, isPast, parseISO } from 'date-fns';
import i18n from 'i18next';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '~js/components/404';
import CommitList from '~js/components/commits/list';
import SubmitReviewModal from '~js/components/orgs/cards/submitReview';
import PlaygroundOrgCard from '~js/components/orgs/playgroundCard';
import TaskOrgCards, {
  ORG_TYPE_TRACKER_DEFAULT,
  OrgTypeTracker,
} from '~js/components/orgs/taskOrgCards';
import { Step } from '~js/components/steps/stepsItem';
import CaptureModal from '~js/components/tasks/capture';
import TaskStatusPath from '~js/components/tasks/path';
import TaskStatusSteps from '~js/components/tasks/steps';
import {
  CreateOrgModal,
  DeleteModal,
  DetailPageLayout,
  EditModal,
  ExternalLink,
  getEpicLoadingOrNotFound,
  getProjectLoadingOrNotFound,
  getTaskLoadingOrNotFound,
  LabelWithSpinner,
  PageOptions,
  SpinnerWrapper,
  SubmitModal,
  useFetchEpicIfMissing,
  useFetchOrgsIfMissing,
  useFetchProjectIfMissing,
  useFetchTasksIfMissing,
  useIsMounted,
} from '~js/components/utils';
import { AppState, ThunkDispatch } from '~js/store';
import { createObject } from '~js/store/actions';
import { refetchOrg, refreshOrg } from '~js/store/orgs/actions';
import { Org, OrgsByParent } from '~js/store/orgs/reducer';
import { selectProjectCollaborator } from '~js/store/projects/selectors';
import { selectTask, selectTaskSlug } from '~js/store/tasks/selectors';
import { User } from '~js/store/user/reducer';
import { selectUserState } from '~js/store/user/selectors';
import {
  DEFAULT_ORG_CONFIG_NAME,
  OBJECT_TYPES,
  ORG_TYPES,
  OrgTypes,
  REVIEW_STATUSES,
  TASK_STATUSES,
} from '~js/utils/constants';
import { getBranchLink, getTaskCommits } from '~js/utils/helpers';
import routes from '~js/utils/routes';

const ResubmitButton = ({
  canSubmit,
  onClick,
  children,
}: {
  canSubmit: boolean;
  onClick: any;
  children: ReactNode;
}) => {
  if (canSubmit) {
    return (
      <Button variant="link" onClick={onClick}>
        {children}
      </Button>
    );
  }
  return <>{children}</>;
};

const TaskDetail = (props: RouteComponentProps) => {
  const [fetchingChanges, setFetchingChanges] = useState(false);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [assignUserModalOpen, setAssignUserModalOpen] =
    useState<OrgTypes | null>(null);
  const [isCreatingOrg, setIsCreatingOrg] = useState<OrgTypeTracker>(
    ORG_TYPE_TRACKER_DEFAULT,
  );
  const [submitReviewModalOpen, setSubmitReviewModalOpen] = useState(false);
  const isMounted = useIsMounted();

  const { project, projectSlug } = useFetchProjectIfMissing(props);
  const { epic, epicSlug, epicCollaborators } = useFetchEpicIfMissing(
    project,
    props,
  );
  const dispatch = useDispatch<ThunkDispatch>();
  useFetchTasksIfMissing(epic, props);
  const selectTaskWithProps = useCallback(selectTask, []);
  const selectTaskSlugWithProps = useCallback(selectTaskSlug, []);
  const task = useSelector((state: AppState) =>
    selectTaskWithProps(state, props),
  );
  const taskSlug = useSelector((state: AppState) =>
    selectTaskSlugWithProps(state, props),
  );
  const { orgs } = useFetchOrgsIfMissing({ task, props });
  const user = useSelector(selectUserState) as User;
  const qaUser = useSelector((state: AppState) =>
    selectProjectCollaborator(state, project?.id, task?.assigned_qa),
  );

  const readyToSubmit = Boolean(
    task?.has_unmerged_commits && !task?.pr_is_open,
  );
  const currentlySubmitting = Boolean(task?.currently_creating_pr);
  const userIsAssignedDev = Boolean(user.github_id === task?.assigned_dev);
  const userIsAssignedTester = Boolean(user.github_id === task?.assigned_qa);
  const hasReviewRejected = Boolean(
    task?.review_valid &&
      task?.review_status === REVIEW_STATUSES.CHANGES_REQUESTED,
  );
  let currentlyFetching = false;
  let currentlyCommitting = false;
  let currentlyReassigning = false;
  let orgHasChanges = false;
  let userIsDevOwner = false;
  let userIsTestOwner = false;
  let devOrg: Org | null | undefined,
    testOrg: Org | null | undefined,
    playgroundOrg: Org | null | undefined,
    taskOrgs: OrgsByParent | undefined;
  let hasOrgs = false;
  let testOrgSubmittingReview = false;
  let devOrgIsCreating = false;
  let testOrgIsCreating = false;
  let devOrgIsDeleting = false;
  let testOrgIsDeleting = false;
  let testOrgIsRefreshing = false;
  if (orgs) {
    taskOrgs = {
      [ORG_TYPES.DEV]:
        orgs.find((org) => org.org_type === ORG_TYPES.DEV) || null,
      [ORG_TYPES.QA]: orgs.find((org) => org.org_type === ORG_TYPES.QA) || null,
      [ORG_TYPES.PLAYGROUND]:
        orgs.find((org) => org.org_type === ORG_TYPES.PLAYGROUND) || null,
    };
    devOrg = taskOrgs[ORG_TYPES.DEV];
    testOrg = taskOrgs[ORG_TYPES.QA];
    playgroundOrg = taskOrgs[ORG_TYPES.PLAYGROUND];
    orgHasChanges =
      (devOrg?.total_unsaved_changes || 0) -
        (devOrg?.total_ignored_changes || 0) >
      0;
    userIsDevOwner = Boolean(
      userIsAssignedDev && devOrg?.is_created && devOrg?.owner === user.id,
    );
    userIsTestOwner = Boolean(
      userIsAssignedTester && testOrg?.is_created && testOrg?.owner === user.id,
    );
    currentlyFetching = Boolean(devOrg?.currently_refreshing_changes);
    currentlyCommitting = Boolean(devOrg?.currently_capturing_changes);
    currentlyReassigning = Boolean(devOrg?.currently_reassigning_user);
    testOrgSubmittingReview = Boolean(task?.currently_submitting_review);
    devOrgIsCreating = Boolean(
      isCreatingOrg[ORG_TYPES.DEV] || (devOrg && !devOrg.is_created),
    );
    testOrgIsCreating = Boolean(
      isCreatingOrg[ORG_TYPES.QA] || (testOrg && !testOrg.is_created),
    );
    devOrgIsDeleting = Boolean(devOrg?.delete_queued_at);
    testOrgIsDeleting = Boolean(testOrg?.delete_queued_at);
    testOrgIsRefreshing = Boolean(testOrg?.currently_refreshing_org);
    if (devOrg || testOrg) {
      hasOrgs = true;
    }
  }
  const readyToCaptureChanges = userIsDevOwner && orgHasChanges;
  const orgHasBeenVisited = Boolean(userIsDevOwner && devOrg?.has_been_visited);
  const taskCommits = task ? getTaskCommits(task) : [];
  const testOrgOutOfDate = Boolean(
    testOrg?.is_created &&
      taskCommits.indexOf(testOrg.latest_commit || '') !== 0,
  );
  const testOrgReadyForReview = Boolean(
    task?.pr_is_open &&
      userIsAssignedTester &&
      !testOrgOutOfDate &&
      (userIsTestOwner || (!testOrg && task.review_valid)),
  );
  const devOrgLoading =
    devOrgIsCreating ||
    devOrgIsDeleting ||
    currentlyFetching ||
    currentlyReassigning ||
    currentlyCommitting;
  const testOrgLoading =
    testOrgIsCreating ||
    testOrgIsDeleting ||
    testOrgIsRefreshing ||
    testOrgSubmittingReview;

  const openSubmitReviewModal = () => {
    setSubmitReviewModalOpen(true);
    setCaptureModalOpen(false);
    setSubmitModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setCreateOrgModalOpen(false);
  };
  const closeSubmitReviewModal = () => {
    setSubmitReviewModalOpen(false);
  };
  const openCaptureModal = () => {
    setCaptureModalOpen(true);
    setSubmitReviewModalOpen(false);
    setSubmitModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setCreateOrgModalOpen(false);
  };
  const closeCaptureModal = () => {
    setCaptureModalOpen(false);
  };
  const openSubmitModal = () => {
    setSubmitModalOpen(true);
    setSubmitReviewModalOpen(false);
    setCaptureModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setCreateOrgModalOpen(false);
  };
  // edit modal related...
  const openEditModal = () => {
    setEditModalOpen(true);
    setSubmitReviewModalOpen(false);
    setSubmitModalOpen(false);
    setCaptureModalOpen(false);
    setDeleteModalOpen(false);
    setCreateOrgModalOpen(false);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
  };
  // delete modal related
  const openDeleteModal = () => {
    setDeleteModalOpen(true);
    setSubmitReviewModalOpen(false);
    setEditModalOpen(false);
    setSubmitModalOpen(false);
    setCaptureModalOpen(false);
    setCreateOrgModalOpen(false);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  // assign user modal related
  const openAssignUserModal = (type: OrgTypes) => {
    setAssignUserModalOpen(type);
    setSubmitReviewModalOpen(false);
    setCaptureModalOpen(false);
    setSubmitModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setCreateOrgModalOpen(false);
  };
  const closeAssignUserModal = () => {
    setAssignUserModalOpen(null);
  };

  // create playground org modal related...
  const openCreateOrgModal = () => {
    setCreateOrgModalOpen(true);
    setEditModalOpen(false);
    setSubmitReviewModalOpen(false);
    setSubmitModalOpen(false);
    setCaptureModalOpen(false);
    setDeleteModalOpen(false);
  };
  const closeCreateOrgModal = () => {
    setCreateOrgModalOpen(false);
  };

  const doRefetchOrg = useCallback(
    (org: Org) => {
      dispatch(refetchOrg(org));
    },
    [dispatch],
  );

  const doRefreshOrg = useCallback(
    (org: Org) => {
      dispatch(refreshOrg(org));
    },
    [dispatch],
  );

  const doCreateOrg = useCallback(
    (type: OrgTypes) => {
      /* istanbul ignore else */
      if (!epic?.currently_creating_branch) {
        setIsCreatingOrg({ ...isCreatingOrg, [type]: true });
        dispatch(
          createObject({
            objectType: OBJECT_TYPES.ORG,
            data: {
              task: task?.id,
              org_type: type,
              org_config_name: task?.org_config_name || DEFAULT_ORG_CONFIG_NAME,
            },
            shouldSubscribeToObject: false,
          }),
        ).finally(() => {
          /* istanbul ignore else */
          if (isMounted.current) {
            setIsCreatingOrg({ ...isCreatingOrg, [type]: false });
          }
        });
      }
    },
    [
      dispatch,
      isCreatingOrg,
      isMounted,
      epic?.currently_creating_branch,
      task?.id,
      task?.org_config_name,
    ],
  );

  const doCaptureChanges = useCallback(() => {
    /* istanbul ignore else */
    if (devOrg) {
      let shouldCheck = true;
      const checkAfterMinutes = window.GLOBALS.ORG_RECHECK_MINUTES;
      if (
        orgHasChanges &&
        devOrg.last_checked_unsaved_changes_at !== null &&
        typeof checkAfterMinutes === 'number'
      ) {
        const lastChecked = parseISO(devOrg.last_checked_unsaved_changes_at);
        const shouldCheckAfter = addMinutes(lastChecked, checkAfterMinutes);
        shouldCheck = isPast(shouldCheckAfter);
      }
      if (shouldCheck) {
        setFetchingChanges(true);
        doRefetchOrg(devOrg);
      } else {
        openCaptureModal();
      }
    }
  }, [devOrg, doRefetchOrg, orgHasChanges]);

  const handleStepAction = useCallback(
    (step: Step) => {
      const action = step.action;
      switch (action) {
        case 'assign-dev': {
          openAssignUserModal(ORG_TYPES.DEV);
          break;
        }
        case 'create-dev-org': {
          /* istanbul ignore else */
          if (!devOrg && userIsAssignedDev) {
            doCreateOrg(ORG_TYPES.DEV);
          }
          break;
        }
        case 'retrieve-changes': {
          /* istanbul ignore else */
          if (readyToCaptureChanges && !devOrgLoading) {
            doCaptureChanges();
          }
          break;
        }
        case 'submit-changes': {
          /* istanbul ignore else */
          if (readyToSubmit && !currentlySubmitting) {
            openSubmitModal();
          }
          break;
        }
        case 'assign-qa': {
          openAssignUserModal(ORG_TYPES.QA);
          break;
        }
        case 'create-qa-org': {
          /* istanbul ignore else */
          if (!testOrg && userIsAssignedTester) {
            doCreateOrg(ORG_TYPES.QA);
          }
          break;
        }
        case 'refresh-test-org': {
          /* istanbul ignore else */
          if (
            testOrg &&
            userIsTestOwner &&
            testOrgOutOfDate &&
            !testOrgLoading
          ) {
            doRefreshOrg(testOrg);
          }
          break;
        }
        case 'submit-review': {
          /* istanbul ignore else */
          if (userIsAssignedTester && !testOrgSubmittingReview) {
            openSubmitReviewModal();
          }
          break;
        }
      }
    },
    [
      devOrg,
      testOrg,
      userIsAssignedDev,
      userIsAssignedTester,
      userIsTestOwner,
      readyToCaptureChanges,
      readyToSubmit,
      testOrgOutOfDate,
      devOrgLoading,
      testOrgLoading,
      currentlySubmitting,
      testOrgSubmittingReview,
      doCreateOrg,
      doCaptureChanges,
      doRefreshOrg,
    ],
  );

  // When capture changes has been triggered, wait until org has been refreshed
  useEffect(() => {
    const changesFetched =
      fetchingChanges && devOrg && !devOrg.currently_refreshing_changes;

    if (changesFetched && devOrg) {
      setFetchingChanges(false);
      /* istanbul ignore else */
      if (orgHasChanges && !submitModalOpen) {
        openCaptureModal();
      }
    }
  }, [fetchingChanges, devOrg, orgHasChanges, submitModalOpen]);

  // If the task slug changes, make sure EditTask modal is closed
  useEffect(() => {
    if (taskSlug && task && taskSlug !== task.slug) {
      setEditModalOpen(false);
    }
  }, [task, taskSlug]);

  const projectLoadingOrNotFound = getProjectLoadingOrNotFound({
    project,
    projectSlug,
  });
  if (projectLoadingOrNotFound !== false) {
    return projectLoadingOrNotFound;
  }

  const epicLoadingOrNotFound = getEpicLoadingOrNotFound({
    project,
    epic,
    epicSlug,
  });

  if (epicLoadingOrNotFound !== false) {
    return epicLoadingOrNotFound;
  }

  const taskLoadingOrNotFound = getTaskLoadingOrNotFound({
    project,
    epic,
    task,
    taskSlug,
  });

  if (taskLoadingOrNotFound !== false) {
    return taskLoadingOrNotFound;
  }

  // This redundant check is used to satisfy TypeScript...
  /* istanbul ignore if */
  if (!project || !epic || !task) {
    return <FourOhFour />;
  }

  if (
    (projectSlug && projectSlug !== project.slug) ||
    (epicSlug && epicSlug !== epic.slug) ||
    (taskSlug && taskSlug !== task.slug)
  ) {
    // Redirect to most recent project/epic/task slug
    return (
      <Redirect to={routes.task_detail(project.slug, epic.slug, task.slug)} />
    );
  }

  const handlePageOptionSelect = (selection: 'edit' | 'delete') => {
    switch (selection) {
      case 'edit': {
        openEditModal();
        break;
      }
      case 'delete': {
        openDeleteModal();
        break;
      }
    }
  };

  const { branchLink, branchLinkText } = getBranchLink(task);
  const onRenderHeaderActions = () => (
    <PageHeaderControl>
      {project.has_push_permission && (
        <PageOptions
          modelType={OBJECT_TYPES.TASK}
          handleOptionSelect={handlePageOptionSelect}
        />
      )}
      {branchLink && (
        <ExternalLink
          url={branchLink}
          showButtonIcon
          className="slds-button slds-button_outline-brand"
        >
          {branchLinkText}
        </ExternalLink>
      )}
    </PageHeaderControl>
  );

  let submitButton: React.ReactNode = null;
  if (readyToSubmit && project.has_push_permission) {
    const isPrimary = !readyToCaptureChanges;
    const submitButtonText = currentlySubmitting ? (
      <LabelWithSpinner
        label={i18n.t('Submitting Task for Testing…')}
        variant={isPrimary ? 'inverse' : 'base'}
      />
    ) : (
      i18n.t('Submit Task for Testing')
    );
    submitButton = (
      <Button
        label={submitButtonText}
        className="slds-m-bottom_x-large slds-m-left_none"
        variant={isPrimary ? 'brand' : 'outline-brand'}
        onClick={openSubmitModal}
        disabled={currentlySubmitting}
      />
    );
  }

  let captureButton: React.ReactNode = null;
  if (
    project.has_push_permission &&
    (readyToCaptureChanges || orgHasBeenVisited)
  ) {
    let captureButtonText: JSX.Element = i18n.t(
      'Check for Unretrieved Changes',
    );
    const isPrimary =
      (orgHasChanges || !readyToSubmit) &&
      (!task.pr_is_open || hasReviewRejected);
    if (currentlyCommitting) {
      /* istanbul ignore next */
      captureButtonText = (
        <LabelWithSpinner
          label={i18n.t('Retrieving Selected Changes…')}
          variant={isPrimary ? 'inverse' : 'base'}
        />
      );
    } else if (fetchingChanges || currentlyFetching) {
      /* istanbul ignore next */
      captureButtonText = (
        <LabelWithSpinner
          label={i18n.t('Checking for Unretrieved Changes…')}
          variant={isPrimary ? 'inverse' : 'base'}
        />
      );
    } else if (currentlyReassigning) {
      /* istanbul ignore next */
      captureButtonText = (
        <LabelWithSpinner
          label={i18n.t('Reassigning Org Ownership…')}
          variant={isPrimary ? 'inverse' : 'base'}
        />
      );
    } else if (orgHasChanges) {
      captureButtonText = i18n.t('Retrieve Changes from Dev Org');
    }
    captureButton = (
      <Button
        label={captureButtonText}
        className={classNames('slds-m-bottom_x-large', {
          'slds-m-right_medium': readyToSubmit,
        })}
        variant={isPrimary ? 'brand' : 'outline-brand'}
        onClick={doCaptureChanges}
        disabled={
          fetchingChanges ||
          currentlyFetching ||
          currentlyCommitting ||
          currentlyReassigning
        }
      />
    );
  }

  const epicUrl = routes.epic_detail(project.slug, epic.slug);
  let headerUrl, headerUrlText; // eslint-disable-line one-var
  /* istanbul ignore else */
  if (task.branch_url && task.branch_name) {
    headerUrl = task.branch_url;
    headerUrlText = task.branch_name;
  } else if (epic.branch_url && epic.branch_name) {
    headerUrl = epic.branch_url;
    headerUrlText = epic.branch_name;
  } else {
    headerUrl = project.repo_url;
    headerUrlText = `${project.repo_owner}/${project.repo_name}`;
  }

  return (
    <DocumentTitle
      title={` ${task.name} | ${epic.name} | ${project.name} | ${i18n.t(
        'Metecho',
      )}`}
    >
      <DetailPageLayout
        title={task.name}
        description={task.description_rendered}
        headerUrl={headerUrl}
        headerUrlText={headerUrlText}
        breadcrumb={[
          {
            name: project.name,
            url: routes.project_detail(project.slug),
          },
          {
            name: epic.name,
            url: epicUrl,
          },
          { name: task.name },
        ]}
        onRenderHeaderActions={onRenderHeaderActions}
        sidebar={
          <>
            <div className="slds-m-bottom_x-large metecho-secondary-block">
              <TaskStatusPath task={task} />
            </div>
            {taskOrgs && task.status !== TASK_STATUSES.COMPLETED ? (
              <div className="slds-m-bottom_x-large metecho-secondary-block">
                {task.status === TASK_STATUSES.CANCELED ? (
                  <>
                    <h3 className="slds-text-heading_medium slds-m-bottom_small">
                      {i18n.t('Next Steps for this Task')}
                    </h3>
                    <p>
                      <Trans i18nKey="taskCanceledHelp">
                        This task was canceled on GitHub before completion.
                        Progress on this task has not been lost, but the task
                        must be{' '}
                        <ResubmitButton
                          canSubmit={
                            readyToSubmit &&
                            project.has_push_permission &&
                            !currentlySubmitting
                          }
                          onClick={openSubmitModal}
                        >
                          re-submitted for testing
                        </ResubmitButton>{' '}
                        before continuing work.
                      </Trans>
                    </p>
                  </>
                ) : (
                  <TaskStatusSteps
                    task={task}
                    orgs={taskOrgs}
                    user={user}
                    projectId={project.id}
                    hasPermissions={project.has_push_permission}
                    isCreatingOrg={isCreatingOrg}
                    handleAction={handleStepAction}
                  />
                )}
              </div>
            ) : null}
          </>
        }
      >
        {captureButton}
        {submitButton}

        {taskOrgs ? (
          <TaskOrgCards
            orgs={taskOrgs}
            task={task}
            projectId={project.id}
            userHasPermissions={project.has_push_permission}
            epicUsers={epicCollaborators}
            githubUsers={project.github_users}
            epicCreatingBranch={epic.currently_creating_branch}
            epicUrl={epicUrl}
            repoUrl={project.repo_url}
            openCaptureModal={openCaptureModal}
            assignUserModalOpen={assignUserModalOpen}
            isCreatingOrg={isCreatingOrg}
            isRefreshingUsers={Boolean(project.currently_refreshing_gh_users)}
            openAssignUserModal={openAssignUserModal}
            closeAssignUserModal={closeAssignUserModal}
            openSubmitReviewModal={openSubmitReviewModal}
            testOrgReadyForReview={testOrgReadyForReview}
            testOrgSubmittingReview={testOrgSubmittingReview}
            doCreateOrg={doCreateOrg}
            doRefreshOrg={doRefreshOrg}
          />
        ) : (
          <SpinnerWrapper />
        )}
        <div className="slds-m-vertical_large">
          <h2 className="slds-text-heading_medium slds-p-bottom_medium">
            {i18n.t('My Task Scratch Org')}
          </h2>
          {taskOrgs ? (
            <>
              {playgroundOrg ? (
                <div
                  className="slds-grid
                    slds-wrap
                    slds-grid_pull-padded-x-small"
                >
                  <div
                    className="slds-size_1-of-1
                      slds-large-size_1-of-2
                      slds-p-around_x-small"
                  >
                    <PlaygroundOrgCard
                      org={playgroundOrg}
                      task={task}
                      repoUrl={project.repo_url}
                    />
                  </div>
                </div>
              ) : (
                <Button
                  label={i18n.t('Create Scratch Org')}
                  variant="outline-brand"
                  onClick={openCreateOrgModal}
                  disabled={epic.currently_creating_branch}
                />
              )}
            </>
          ) : (
            // Fetching scratch orgs from API
            <Button
              label={
                <LabelWithSpinner label={i18n.t('Loading Scratch Orgs…')} />
              }
              disabled
            />
          )}
        </div>
        {project.has_push_permission && (
          <>
            {devOrg &&
              userIsDevOwner &&
              (orgHasChanges || devOrg.has_ignored_changes) && (
                <CaptureModal
                  org={devOrg}
                  isOpen={captureModalOpen}
                  closeModal={closeCaptureModal}
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
                assignee={qaUser}
                originatingUser={user.github_id}
              />
            )}
            <EditModal
              model={task}
              modelType={OBJECT_TYPES.TASK}
              hasOrgs={hasOrgs}
              projectId={project.id}
              orgConfigsLoading={project.currently_fetching_org_config_names}
              orgConfigs={project.org_config_names}
              isOpen={editModalOpen}
              handleClose={closeEditModal}
            />
            <DeleteModal
              model={task}
              modelType={OBJECT_TYPES.TASK}
              isOpen={deleteModalOpen}
              redirect={epicUrl}
              handleClose={closeDeleteModal}
            />
          </>
        )}
        {testOrgReadyForReview && (
          <SubmitReviewModal
            orgId={testOrg?.id}
            url={window.api_urls.task_review(task.id)}
            reviewStatus={task.review_valid ? task.review_status : null}
            isOpen={submitReviewModalOpen && !testOrgSubmittingReview}
            handleClose={closeSubmitReviewModal}
          />
        )}
        <CreateOrgModal
          project={project}
          task={task}
          isOpen={createOrgModalOpen}
          closeModal={closeCreateOrgModal}
        />
        <CommitList commits={task.commits} />
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default TaskDetail;
