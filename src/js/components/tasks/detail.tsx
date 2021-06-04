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
import CreateTaskModal from '~js/components/tasks/createForm';
import TaskStatusPath from '~js/components/tasks/path';
import TaskStatusSteps from '~js/components/tasks/steps';
import TourPopover from '~js/components/tour/popover';
import {
  ContributeWorkModal,
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
import { createObject, updateObject } from '~js/store/actions';
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
  RETRIEVE_CHANGES,
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

const TaskDetail = (
  props: RouteComponentProps<any, any, { [RETRIEVE_CHANGES]?: boolean }>,
) => {
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
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [createModalOrgId, setCreateModalOrgId] = useState<string | null>(null);
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
  const {
    history,
    location: { state },
  } = props;

  const readyToSubmit = Boolean(
    task?.has_unmerged_commits && !task?.pr_is_open,
  );
  const taskIsMerged = task?.status === TASK_STATUSES.COMPLETED;
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
    setAssignUserModalOpen(null);
    setContributeModalOpen(false);
    setCreateModalOrgId(null);
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
    setAssignUserModalOpen(null);
    setContributeModalOpen(false);
    setCreateModalOrgId(null);
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
    setAssignUserModalOpen(null);
    setContributeModalOpen(false);
    setCreateModalOrgId(null);
  };
  // edit modal related...
  const openEditModal = () => {
    setEditModalOpen(true);
    setSubmitReviewModalOpen(false);
    setSubmitModalOpen(false);
    setCaptureModalOpen(false);
    setDeleteModalOpen(false);
    setCreateOrgModalOpen(false);
    setAssignUserModalOpen(null);
    setContributeModalOpen(false);
    setCreateModalOrgId(null);
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
    setAssignUserModalOpen(null);
    setContributeModalOpen(false);
    setCreateModalOrgId(null);
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
    setContributeModalOpen(false);
    setCreateModalOrgId(null);
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
    setAssignUserModalOpen(null);
    setContributeModalOpen(false);
    setCreateModalOrgId(null);
  };
  const closeCreateOrgModal = () => {
    setCreateOrgModalOpen(false);
  };

  // "contribute work" modal related:
  const openContributeModal = () => {
    setContributeModalOpen(true);
    setSubmitReviewModalOpen(false);
    setCaptureModalOpen(false);
    setSubmitModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setCreateOrgModalOpen(false);
    setAssignUserModalOpen(null);
    setCreateModalOrgId(null);
  };
  const closeContributeModal = useCallback(() => {
    setContributeModalOpen(false);
  }, []);

  // "create task" modal related:
  const openCreateModal = useCallback((orgId: string) => {
    setCreateModalOrgId(orgId);
    setContributeModalOpen(false);
    setSubmitReviewModalOpen(false);
    setCaptureModalOpen(false);
    setSubmitModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setCreateOrgModalOpen(false);
    setAssignUserModalOpen(null);
  }, []);
  const closeCreateModal = () => {
    setCreateModalOrgId(null);
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

  const doContributeFromScratchOrg = useCallback(
    ({ id, useExistingTask }: { id: string; useExistingTask: boolean }) => {
      closeContributeModal();
      if (!useExistingTask) {
        openCreateModal(id);
      } /* istanbul ignore else */ else if (!devOrg) {
        /* istanbul ignore else */
        if (!userIsAssignedDev) {
          // Assign current user as Dev
          dispatch(
            updateObject({
              objectType: OBJECT_TYPES.TASK,
              url: window.api_urls.task_assignees(task?.id),
              data: {
                assigned_dev: user.github_id,
              },
            }),
          );
        }
        // Convert Scratch Org to Dev Org
        dispatch(
          updateObject({
            objectType: OBJECT_TYPES.ORG,
            url: window.api_urls.scratch_org_detail(id),
            data: { org_type: ORG_TYPES.DEV },
            patch: true,
          }),
        );
        history.replace({ state: { [RETRIEVE_CHANGES]: true } });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      closeContributeModal,
      openCreateModal,
      devOrg,
      task?.id,
      user.github_id,
      userIsAssignedDev,
    ],
  );

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

  // Auto-open the retrieve-changes modal if `RETRIEVE_CHANGES` param is truthy
  const shouldRetrieve = state?.[RETRIEVE_CHANGES];
  useEffect(() => {
    if (
      shouldRetrieve &&
      readyToCaptureChanges &&
      project?.has_push_permission
    ) {
      // Remove location state
      history.replace({ state: {} });
      doCaptureChanges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    doCaptureChanges,
    project?.has_push_permission,
    readyToCaptureChanges,
    shouldRetrieve,
  ]);

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

  const { branchLink, branchLinkText, popover } = getBranchLink(task, 'task');
  const onRenderHeaderActions = () => (
    <PageHeaderControl>
      {project.has_push_permission && (
        <div className="slds-is-relative inline-container">
          <PageOptions
            modelType={OBJECT_TYPES.TASK}
            handleOptionSelect={handlePageOptionSelect}
          />
          <TourPopover
            align="left"
            heading={i18n.t('Edit or delete this Task')}
            body={
              <Trans i18nKey="tourEditTask">
                Here you can change the name and description of this Task. You
                can also delete the Task. Deleting a Task deletes all the Orgs
                in the Task as well.
              </Trans>
            }
          />
        </div>
      )}
      {branchLink && (
        <div className="slds-is-relative inline-container">
          <ExternalLink
            url={branchLink}
            showButtonIcon
            className="slds-button slds-button_outline-brand"
          >
            {branchLinkText}
          </ExternalLink>
          {popover}
        </div>
      )}
    </PageHeaderControl>
  );

  let submitButton: React.ReactNode = null;
  if (readyToSubmit && project.has_push_permission && !taskIsMerged) {
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
      <div className="slds-is-relative">
        <Button
          label={submitButtonText}
          className="slds-m-bottom_x-large slds-m-left_none"
          variant={isPrimary ? 'brand' : 'outline-brand'}
          onClick={openSubmitModal}
          disabled={currentlySubmitting}
        />
        <TourPopover
          align="top left"
          heading={i18n.t('Submit changes for testing')}
          body={
            <Trans i18nKey="tourTaskSubmit">
              When the work is complete, it’s time to submit the changes so that
              the person assigned as the Tester can access them for testing.
              Developers can retrieve new changes as many times as needed before
              submitting changes for testing.
            </Trans>
          }
        />
      </div>
    );
  }

  let captureButton: React.ReactNode = null;
  if (
    project.has_push_permission &&
    !taskIsMerged &&
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
      <div className="slds-is-relative">
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
        <TourPopover
          align="right"
          heading={i18n.t('Retrieve changes')}
          body={
            <Trans i18nKey="tourTaskRetrieve">
              After you’ve made changes, come back to Metecho to save or
              “retrieve” your changes. You will be asked to select which changes
              to retrieve (or ignore). You will create a “commit” message
              summarizing your changes, so other Collaborators know what was
              changed.
            </Trans>
          }
        />
      </div>
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
        type={OBJECT_TYPES.TASK}
        title={task.name}
        titlePopover={
          <TourPopover
            align="bottom left"
            heading={i18n.t('Task name & GitHub link')}
            body={
              <Trans i18nKey="tourTaskName">
                This is the name of the Task you are viewing. Select the link
                below to leave Metecho and access this branch on GitHub. To edit
                this name, click the gear icon. Epics and Tasks are equivalent
                to GitHub branches.
              </Trans>
            }
          />
        }
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
            <div
              className="slds-m-bottom_x-large
                metecho-secondary-block
                slds-is-relative"
            >
              <TaskStatusPath task={task} />
              <TourPopover
                align="left"
                heading={i18n.t('Task progress path')}
                body={
                  <Trans i18nKey="tourTaskPath">
                    A Task starts its journey as <b>Planned</b>. When a Dev Org
                    is created, the Task is <b>In Progress</b>, and the
                    Developer begins work. When the Developer submits changes
                    for testing, the Task moves to <b>Test</b>. If the Developer
                    retrieves new changes, the Task is again <b>In Progress</b>.
                    The Task is ready to be <b>Merged</b> after the Tester
                    approves the work, and is <b>Complete</b> when the Task has
                    been added to the Project on GitHub.
                  </Trans>
                }
              />
            </div>
            {taskOrgs && !taskIsMerged ? (
              <div
                className="slds-m-bottom_x-large
                  metecho-secondary-block
                  slds-is-relative
                  heading"
              >
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
                  <>
                    <TaskStatusSteps
                      task={task}
                      orgs={taskOrgs}
                      user={user}
                      projectId={project.id}
                      hasPermissions={project.has_push_permission}
                      isCreatingOrg={isCreatingOrg}
                      handleAction={handleStepAction}
                    />
                    <TourPopover
                      align="top"
                      heading={i18n.t('Wondering what to do next?')}
                      body={
                        <Trans i18nKey="tourTaskNextSteps">
                          The Next Steps section is designed as a quick
                          reference to guide you through the process from
                          assigning a Developer to getting your work added to
                          the Project on GitHub. The next step is indicated with
                          a blue ring, and completed steps are checked. You can
                          assign a Tester at any time. Many steps become a link
                          when they are active, giving you a shortcut to take
                          the next action.
                        </Trans>
                      }
                    />
                  </>
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
            convertingOrg={Boolean(shouldRetrieve)}
            doCreateOrg={doCreateOrg}
            doRefreshOrg={doRefreshOrg}
          />
        ) : (
          <SpinnerWrapper />
        )}
        <div className="slds-m-vertical_large slds-is-relative heading">
          <TourPopover
            align="top left"
            heading={i18n.t('View & play with a Task')}
            body={
              <Trans i18nKey="tourTaskStratchOrg">
                Your Scratch Org is a temporary place for you to view the work
                on this Task. You can also use a Scratch Org to play with
                changes to the Task without affecting the Task.
              </Trans>
            }
          />
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
                      openContributeModal={
                        taskIsMerged ? undefined : openContributeModal
                      }
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
        {playgroundOrg && !taskIsMerged ? (
          <>
            <ContributeWorkModal
              task={task}
              isOpen={contributeModalOpen}
              hasPermissions={project.has_push_permission}
              orgId={playgroundOrg.id}
              hasDevOrg={Boolean(devOrg)}
              closeModal={closeContributeModal}
              doContribute={doContributeFromScratchOrg}
            />
            <CreateTaskModal
              project={project}
              epic={epic}
              isOpenOrOrgId={createModalOrgId}
              playgroundOrg={playgroundOrg}
              closeCreateModal={closeCreateModal}
            />
          </>
        ) : null}
        <CommitList commits={task.commits} />
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default TaskDetail;
