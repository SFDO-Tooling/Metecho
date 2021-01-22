import Button from '@salesforce/design-system-react/components/button';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import i18n from 'i18next';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { useDispatch } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '~js/components/404';
import ConfirmRemoveUserModal from '~js/components/epics/confirmRemoveUserModal';
import EpicStatusPath from '~js/components/epics/path';
import EpicProgress from '~js/components/epics/progress';
import EpicStatusSteps from '~js/components/epics/steps';
import { Step } from '~js/components/steps/stepsItem';
import CreateTaskModal from '~js/components/tasks/createForm';
import TaskTable from '~js/components/tasks/table';
import { AssignUsersModal, UserCards } from '~js/components/user/githubUser';
import {
  DeleteModal,
  DetailPageLayout,
  EditModal,
  ExternalLink,
  getEpicLoadingOrNotFound,
  getProjectLoadingOrNotFound,
  LabelWithSpinner,
  PageOptions,
  SpinnerWrapper,
  SubmitModal,
  useFetchEpicIfMissing,
  useFetchProjectIfMissing,
  useFetchTasksIfMissing,
} from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { updateObject } from '~js/store/actions';
import { refreshGitHubUsers } from '~js/store/projects/actions';
import { Task } from '~js/store/tasks/reducer';
import { GitHubUser } from '~js/store/user/reducer';
import { getUrlParam, removeUrlParam } from '~js/utils/api';
import {
  EPIC_STATUSES,
  OBJECT_TYPES,
  ORG_TYPES,
  OrgTypes,
  SHOW_EPIC_COLLABORATORS,
} from '~js/utils/constants';
import { getBranchLink, getCompletedTasks } from '~js/utils/helpers';
import routes from '~js/utils/routes';

const EpicDetail = (props: RouteComponentProps) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const { project, projectSlug } = useFetchProjectIfMissing(props);
  const { epic, epicSlug } = useFetchEpicIfMissing(project, props);
  const { tasks } = useFetchTasksIfMissing(epic, props);

  const [assignUsersModalOpen, setAssignUsersModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // "Assign users to epic" modal related:
  const openAssignUsersModal = useCallback(() => {
    setAssignUsersModalOpen(true);
    setSubmitModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
  }, []);
  const closeAssignUsersModal = useCallback(() => {
    setAssignUsersModalOpen(false);
  }, []);

  // "Confirm remove user from epic" modal related:
  const [waitingToUpdateUsers, setWaitingToUpdateUsers] = useState<
    GitHubUser[] | null
  >(null);
  const [confirmRemoveUsers, setConfirmRemoveUsers] = useState<
    GitHubUser[] | null
  >(null);
  const closeConfirmRemoveUsersModal = useCallback(() => {
    setWaitingToUpdateUsers(null);
    setConfirmRemoveUsers(null);
  }, []);

  // Auto-open the assign-users modal if `SHOW_EPIC_COLLABORATORS` param
  const { history } = props;
  useEffect(() => {
    const showCollaborators = getUrlParam(SHOW_EPIC_COLLABORATORS);
    if (showCollaborators === 'true') {
      // Remove query-string from URL
      history.replace({ search: removeUrlParam(SHOW_EPIC_COLLABORATORS) });
      // Show collaborators modal
      openAssignUsersModal();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If the epic slug changes, make sure EditEpic modal is closed
  useEffect(() => {
    if (epicSlug && epic && epicSlug !== epic.slug) {
      setEditModalOpen(false);
    }
  }, [epic, epicSlug]);

  const usersAssignedToTasks = useMemo(() => {
    const users = new Set<string>();
    (tasks || []).forEach((task) => {
      if (task.assigned_dev) {
        users.add(task.assigned_dev.login);
      }
      if (task.assigned_qa) {
        users.add(task.assigned_qa.login);
      }
    });
    return users;
  }, [tasks]);

  const getRemovedUsers = useCallback(
    (users: GitHubUser[]) => {
      /* istanbul ignore if */
      if (!epic) {
        return [];
      }
      return epic.github_users.filter(
        (oldUser) =>
          usersAssignedToTasks.has(oldUser.login) &&
          !users.find((user) => user.id === oldUser.id),
      );
    },
    [epic, usersAssignedToTasks],
  );
  const updateEpicUsers = useCallback(
    (users: GitHubUser[]) => {
      /* istanbul ignore if */
      if (!epic) {
        return;
      }
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.EPIC,
          data: {
            ...epic,
            github_users: users.sort((a, b) =>
              /* istanbul ignore next */
              a.login.toLowerCase() > b.login.toLowerCase() ? 1 : -1,
            ),
          },
        }),
      );
    },
    [epic, dispatch],
  );
  const setEpicUsers = useCallback(
    (users: GitHubUser[]) => {
      const removedUsers = getRemovedUsers(users);
      if (removedUsers.length) {
        setWaitingToUpdateUsers(users);
        setConfirmRemoveUsers(removedUsers);
        setAssignUsersModalOpen(false);
        setSubmitModalOpen(false);
        setEditModalOpen(false);
        setDeleteModalOpen(false);
      } else {
        updateEpicUsers(users);
      }
      setAssignUsersModalOpen(false);
    },
    [updateEpicUsers, getRemovedUsers],
  );
  const removeEpicUser = useCallback(
    (user: GitHubUser) => {
      /* istanbul ignore if */
      if (!epic) {
        return;
      }
      const users = epic.github_users.filter(
        (possibleUser) => user.id !== possibleUser.id,
      );
      const removedUsers = getRemovedUsers(users);
      if (removedUsers.length) {
        setWaitingToUpdateUsers(users);
        setConfirmRemoveUsers(removedUsers);
        setAssignUsersModalOpen(false);
        setSubmitModalOpen(false);
        setEditModalOpen(false);
        setDeleteModalOpen(false);
      } else {
        updateEpicUsers(users);
      }
    },
    [epic, updateEpicUsers, getRemovedUsers],
  );
  const doRefreshGitHubUsers = useCallback(() => {
    /* istanbul ignore if */
    if (!project) {
      return;
    }
    dispatch(refreshGitHubUsers(project.id));
  }, [project, dispatch]);

  // "Assign user to task" modal related:
  const assignUser = useCallback(
    ({
      task,
      type,
      assignee,
      shouldAlertAssignee,
    }: {
      task: Task;
      type: OrgTypes;
      assignee: GitHubUser | null;
      shouldAlertAssignee: boolean;
    }) => {
      /* istanbul ignore next */
      const userType = type === ORG_TYPES.DEV ? 'assigned_dev' : 'assigned_qa';
      const alertType =
        type === ORG_TYPES.DEV ? 'should_alert_dev' : 'should_alert_qa';
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.TASK,
          data: {
            ...task,
            [userType]: assignee,
            [alertType]: shouldAlertAssignee,
          },
        }),
      );
    },
    [dispatch],
  );

  // "Submit" modal related:
  const openSubmitModal = () => {
    setSubmitModalOpen(true);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setAssignUsersModalOpen(false);
  };
  const currentlySubmitting = Boolean(epic?.currently_creating_pr);
  const readyToSubmit = Boolean(
    epic?.has_unmerged_commits &&
      !epic?.pr_is_open &&
      epic?.status !== EPIC_STATUSES.MERGED,
  );

  // "edit" modal related:
  const openEditModal = () => {
    setEditModalOpen(true);
    setDeleteModalOpen(false);
    setSubmitModalOpen(false);
    setAssignUsersModalOpen(false);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
  };
  // "delete" modal related:
  const openDeleteModal = () => {
    setDeleteModalOpen(true);
    setEditModalOpen(false);
    setSubmitModalOpen(false);
    setAssignUsersModalOpen(false);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };
  const openCreateModal = () => {
    setCreateModalOpen(true);
  };
  const closeCreateModal = () => {
    setCreateModalOpen(false);
  };

  // "Next Steps" action handler
  const handleStepAction = useCallback(
    (step: Step) => {
      const action = step.action;
      switch (action) {
        case 'submit':
          /* istanbul ignore else */
          if (readyToSubmit && !currentlySubmitting) {
            openSubmitModal();
          }
          break;
      }
    },
    [readyToSubmit, currentlySubmitting],
  );

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

  // This redundant check is used to satisfy TypeScript...
  /* istanbul ignore if */
  if (!project || !epic) {
    return <FourOhFour />;
  }

  if (
    (projectSlug && projectSlug !== project.slug) ||
    (epicSlug && epicSlug !== epic.slug)
  ) {
    // Redirect to most recent project/epic slug
    return <Redirect to={routes.epic_detail(project.slug, epic.slug)} />;
  }

  // Progress Bar:
  const tasksCompleted = tasks ? getCompletedTasks(tasks).length : 0;
  const tasksTotal = tasks?.length || 0;
  const epicProgress: [number, number] = [tasksCompleted, tasksTotal];

  // "Submit Epic for Review on GitHub" button:
  let submitButton: React.ReactNode = null;
  if (readyToSubmit) {
    const submitButtonText = currentlySubmitting ? (
      <LabelWithSpinner
        label={i18n.t('Submitting Epic for Review on GitHub…')}
        variant="inverse"
      />
    ) : (
      i18n.t('Submit Epic for Review on GitHub')
    );
    submitButton = (
      <Button
        label={submitButtonText}
        className="slds-m-bottom_large"
        variant="brand"
        onClick={openSubmitModal}
        disabled={currentlySubmitting}
      />
    );
  }

  const handlePageOptionSelect = (selection: 'edit' | 'delete') => {
    switch (selection) {
      case 'edit':
        openEditModal();
        break;
      case 'delete':
        openDeleteModal();
        break;
    }
  };
  const { branchLink, branchLinkText } = getBranchLink(epic);
  const onRenderHeaderActions = () => (
    <PageHeaderControl>
      <PageOptions
        modelType={OBJECT_TYPES.EPIC}
        handleOptionSelect={handlePageOptionSelect}
      />
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

  const projectUrl = routes.project_detail(project.slug);
  let headerUrl, headerUrlText;
  /* istanbul ignore else */
  if (epic.branch_url && epic.branch_name) {
    headerUrl = epic.branch_url;
    headerUrlText = epic.branch_name;
  } else {
    headerUrl = project.repo_url;
    headerUrlText = `${project.repo_owner}/${project.repo_name}`;
  }

  const epicIsMerged = epic.status === EPIC_STATUSES.MERGED;
  const epicHasTasks = Boolean(tasks && tasks.length > 0);

  return (
    <DocumentTitle
      title={`${epic.name} | ${project.name} | ${i18n.t('Metecho')}`}
    >
      <DetailPageLayout
        title={epic.name}
        description={epic.description_rendered}
        headerUrl={headerUrl}
        headerUrlText={headerUrlText}
        breadcrumb={[
          {
            name: project.name,
            url: projectUrl,
          },
          { name: epic.name },
        ]}
        onRenderHeaderActions={onRenderHeaderActions}
        sidebar={
          <>
            <div className="slds-m-bottom_x-large metecho-secondary-block">
              <h2 className="slds-text-heading_medium slds-p-bottom_small">
                {i18n.t('Collaborators')}
              </h2>
              <Button
                label={i18n.t('Add or Remove Collaborators')}
                variant="outline-brand"
                onClick={openAssignUsersModal}
              />
              <AssignUsersModal
                allUsers={project.github_users}
                selectedUsers={epic.github_users}
                heading={i18n.t(
                  'Add or Remove Collaborators for {{epic_name}}',
                  { epic_name: epic.name },
                )}
                isOpen={assignUsersModalOpen}
                onRequestClose={closeAssignUsersModal}
                setUsers={setEpicUsers}
                isRefreshing={Boolean(project.currently_refreshing_gh_users)}
                refreshUsers={doRefreshGitHubUsers}
              />
              <ConfirmRemoveUserModal
                confirmRemoveUsers={confirmRemoveUsers}
                waitingToUpdateUsers={waitingToUpdateUsers}
                handleClose={closeConfirmRemoveUsersModal}
                handleUpdateUsers={updateEpicUsers}
              />
              {epic.github_users.length ? (
                <UserCards
                  users={epic.github_users}
                  removeUser={removeEpicUser}
                />
              ) : null}
            </div>
            <div className="slds-m-bottom_x-large metecho-secondary-block">
              <EpicStatusSteps
                epic={epic}
                tasks={tasks || []}
                readyToSubmit={readyToSubmit}
                currentlySubmitting={currentlySubmitting}
                handleAction={handleStepAction}
              />
            </div>
          </>
        }
      >
        <EpicStatusPath status={epic.status} prIsOpen={epic.pr_is_open} />
        {submitButton}
        {tasks ? (
          <>
            <h2 className="slds-text-heading_medium slds-p-bottom_medium">
              {epicHasTasks || epicIsMerged
                ? i18n.t('Tasks for {{epic_name}}', { epic_name: epic.name })
                : i18n.t('Add a Task for {{epic_name}}', {
                    epic_name: epic.name,
                  })}
            </h2>
            {!epicIsMerged && (
              <Button
                label={i18n.t('Add a Task')}
                variant="brand"
                onClick={openCreateModal}
                className="slds-m-bottom_large"
              />
            )}
            {epicHasTasks && (
              <>
                <EpicProgress range={epicProgress} />
                <TaskTable
                  projectSlug={project.slug}
                  epicSlug={epic.slug}
                  tasks={tasks}
                  epicUsers={epic.github_users}
                  openAssignEpicUsersModal={openAssignUsersModal}
                  assignUserAction={assignUser}
                />
              </>
            )}
          </>
        ) : (
          // Fetching tasks from API
          <SpinnerWrapper />
        )}
        {readyToSubmit && (
          <SubmitModal
            instanceId={epic.id}
            instanceName={epic.name}
            instanceDiffUrl={epic.branch_diff_url}
            instanceType={OBJECT_TYPES.EPIC}
            isOpen={submitModalOpen}
            toggleModal={setSubmitModalOpen}
          />
        )}
        <EditModal
          model={epic}
          modelType={OBJECT_TYPES.EPIC}
          isOpen={editModalOpen}
          handleClose={closeEditModal}
        />
        <DeleteModal
          model={epic}
          modelType={OBJECT_TYPES.EPIC}
          isOpen={deleteModalOpen}
          redirect={projectUrl}
          handleClose={closeDeleteModal}
        />
        {!epicIsMerged && (
          <CreateTaskModal
            epic={epic}
            isOpen={createModalOpen}
            closeCreateModal={closeCreateModal}
          />
        )}
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default EpicDetail;
