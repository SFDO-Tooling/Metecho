import Button from '@salesforce/design-system-react/components/button';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import i18n from 'i18next';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '~js/components/404';
import ConfirmRemoveUserModal from '~js/components/epics/confirmRemoveUserModal';
import EpicStatusPath from '~js/components/epics/path';
import EpicProgress from '~js/components/epics/progress';
import EpicStatusSteps from '~js/components/epics/steps';
import AssignEpicCollaboratorsModal from '~js/components/githubUsers/assignEpicCollaborators';
import UserCards from '~js/components/githubUsers/cards';
import PlaygroundOrgCard from '~js/components/orgs/playgroundCard';
import { Step } from '~js/components/steps/stepsItem';
import CreateTaskModal from '~js/components/tasks/createForm';
import TaskTable from '~js/components/tasks/table';
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
  LabelWithSpinner,
  PageOptions,
  SpinnerWrapper,
  SubmitModal,
  useFetchEpicIfMissing,
  useFetchOrgsIfMissing,
  useFetchProjectIfMissing,
  useFetchTasksIfMissing,
} from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { updateObject } from '~js/store/actions';
import { Org } from '~js/store/orgs/reducer';
import { Task } from '~js/store/tasks/reducer';
import { GitHubUser, User } from '~js/store/user/reducer';
import { selectUserState } from '~js/store/user/selectors';
import {
  EPIC_STATUSES,
  OBJECT_TYPES,
  ORG_TYPES,
  OrgTypes,
} from '~js/utils/constants';
import { getBranchLink, getCompletedTasks } from '~js/utils/helpers';
import routes from '~js/utils/routes';

const EpicDetail = (props: RouteComponentProps) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const { project, projectSlug } = useFetchProjectIfMissing(props);
  const { epic, epicSlug, epicCollaborators } = useFetchEpicIfMissing(
    project,
    props,
  );
  const { tasks } = useFetchTasksIfMissing(epic, props);
  const { orgs } = useFetchOrgsIfMissing({ epic, props });
  const currentUser = useSelector(selectUserState) as User;

  const [assignUsersModalOpen, setAssignUsersModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOrgIdOrOpen, setCreateModalOrgIdOrOpen] =
    useState<boolean | string>(false);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);

  const playgroundOrg = (orgs || [])[0] as Org | undefined;

  // "Assign users to epic" modal related:
  const openAssignUsersModal = useCallback(() => {
    setAssignUsersModalOpen(true);
    setContributeModalOpen(false);
    setSubmitModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setCreateModalOrgIdOrOpen(false);
    setCreateOrgModalOpen(false);
  }, []);
  const closeAssignUsersModal = useCallback(() => {
    setAssignUsersModalOpen(false);
  }, []);

  // "Confirm remove user from epic" modal related:
  const [waitingToUpdateUsers, setWaitingToUpdateUsers] =
    useState<GitHubUser[] | null>(null);
  const [confirmRemoveUsers, setConfirmRemoveUsers] =
    useState<GitHubUser[] | null>(null);
  const closeConfirmRemoveUsersModal = useCallback(() => {
    setWaitingToUpdateUsers(null);
    setConfirmRemoveUsers(null);
  }, []);

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
        users.add(task.assigned_dev);
      }
      if (task.assigned_qa) {
        users.add(task.assigned_qa);
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
      return epicCollaborators.filter(
        (oldUser) =>
          usersAssignedToTasks.has(oldUser.id) &&
          !users.find((user) => user.id === oldUser.id),
      );
    },
    [epic, epicCollaborators, usersAssignedToTasks],
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
          url: window.api_urls.epic_collaborators(epic.id),
          data: {
            github_users: users
              .sort((a, b) =>
                /* istanbul ignore next */
                a.login.toLowerCase() > b.login.toLowerCase() ? 1 : -1,
              )
              .map((user) => user.id),
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
        setContributeModalOpen(false);
        setCreateModalOrgIdOrOpen(false);
        setCreateOrgModalOpen(false);
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
      const users = epicCollaborators.filter(
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
        setContributeModalOpen(false);
        setCreateModalOrgIdOrOpen(false);
        setCreateOrgModalOpen(false);
      } else {
        updateEpicUsers(users);
      }
    },
    [epic, epicCollaborators, updateEpicUsers, getRemovedUsers],
  );

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
      assignee: string | null;
      shouldAlertAssignee: boolean;
    }) => {
      /* istanbul ignore next */
      const userType = type === ORG_TYPES.DEV ? 'assigned_dev' : 'assigned_qa';
      const alertType =
        type === ORG_TYPES.DEV ? 'should_alert_dev' : 'should_alert_qa';
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.TASK,
          url: window.api_urls.task_assignees(task.id),
          data: {
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
    setCreateModalOrgIdOrOpen(false);
    setCreateOrgModalOpen(false);
    setContributeModalOpen(false);
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
    setCreateModalOrgIdOrOpen(false);
    setCreateOrgModalOpen(false);
    setContributeModalOpen(false);
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
    setCreateModalOrgIdOrOpen(false);
    setCreateOrgModalOpen(false);
    setContributeModalOpen(false);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  // "create task" modal related:
  const openCreateModal = () => {
    setCreateModalOrgIdOrOpen(true);
    setDeleteModalOpen(false);
    setEditModalOpen(false);
    setSubmitModalOpen(false);
    setAssignUsersModalOpen(false);
    setCreateOrgModalOpen(false);
    setContributeModalOpen(false);
  };
  const closeCreateModal = () => {
    setCreateModalOrgIdOrOpen(false);
  };

  // "create scratch org" modal related:
  const openCreateOrgModal = () => {
    setCreateOrgModalOpen(true);
    setCreateModalOrgIdOrOpen(false);
    setDeleteModalOpen(false);
    setEditModalOpen(false);
    setSubmitModalOpen(false);
    setAssignUsersModalOpen(false);
    setContributeModalOpen(false);
  };
  const closeCreateOrgModal = () => {
    setCreateOrgModalOpen(false);
  };

  // "contribute work" modal related:
  const openContributeModal = () => {
    setContributeModalOpen(true);
    setCreateModalOrgIdOrOpen(false);
    setDeleteModalOpen(false);
    setEditModalOpen(false);
    setSubmitModalOpen(false);
    setAssignUsersModalOpen(false);
    setCreateOrgModalOpen(false);
  };
  const closeContributeModal = useCallback(() => {
    setContributeModalOpen(false);
  }, []);
  const createAndContribute = useCallback(({ id }: { id: string }) => {
    setCreateModalOrgIdOrOpen(id);
    setDeleteModalOpen(false);
    setEditModalOpen(false);
    setSubmitModalOpen(false);
    setAssignUsersModalOpen(false);
    setCreateOrgModalOpen(false);
    setContributeModalOpen(false);
  }, []);

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
  if (readyToSubmit && project.has_push_permission) {
    const submitButtonText = currentlySubmitting ? (
      <LabelWithSpinner
        label={i18n.t('Submitting Epic for Review on GitHub…')}
        variant="inverse"
      />
    ) : (
      i18n.t('Submit Epic for Review on GitHub')
    );
    submitButton = (
      <div className="slds-is-relative">
        <Button
          label={submitButtonText}
          className="slds-m-bottom_large"
          variant="brand"
          onClick={openSubmitModal}
          disabled={currentlySubmitting}
        />
        <TourPopover
          align="right"
          heading={i18n.t('Submit this Epic for review')}
          body={
            <Trans i18nKey="tourEpicSubmitReview">
              When an Epic has completed Tasks, it can be submitted for review.
              The GitHub Project maintainers will approve the Epic or ask for
              changes.
            </Trans>
          }
        />
      </div>
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
  const { branchLink, branchLinkText, popover } = getBranchLink(epic, 'epic');
  const onRenderHeaderActions = () => (
    <PageHeaderControl>
      {project.has_push_permission && (
        <div className="slds-is-relative inline-container">
          <PageOptions
            modelType={OBJECT_TYPES.EPIC}
            handleOptionSelect={handlePageOptionSelect}
          />
          <TourPopover
            align="left"
            heading={i18n.t('Edit or delete this Epic')}
            body={
              <Trans i18nKey="tourEditEpic">
                Here you can change the name and description of this Epic. You
                can also delete the Epic. Deleting an Epic deletes all the Tasks
                and Orgs in the Epic as well.
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
  let taskHeader = i18n.t('Tasks for {{epic_name}}', { epic_name: epic.name });
  if (!epicHasTasks && !epicIsMerged) {
    taskHeader = project.has_push_permission
      ? i18n.t('Add a Task for {{epic_name}}', {
          epic_name: epic.name,
        })
      : i18n.t('No Tasks for {{epic_name}}', { epic_name: epic.name });
  }

  return (
    <DocumentTitle
      title={`${epic.name} | ${project.name} | ${i18n.t('Metecho')}`}
    >
      <DetailPageLayout
        type={OBJECT_TYPES.EPIC}
        title={epic.name}
        titlePopover={
          <TourPopover
            align="bottom left"
            heading={i18n.t('Epic name & GitHub link')}
            body={
              <Trans i18nKey="tourEpicName">
                This is the name of the Epic you are viewing. Select the link
                below the Epic name to leave Metecho and access the Project’s
                branch on GitHub. To edit this name, click the gear icon. Epics
                and Tasks are equivalent to GitHub branches.
              </Trans>
            }
          />
        }
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
                {project.has_push_permission || epicCollaborators.length
                  ? i18n.t('Collaborators')
                  : i18n.t('No Collaborators')}
              </h2>
              {project.has_push_permission && (
                <>
                  <div className="slds-is-relative">
                    <Button
                      label={i18n.t('Add or Remove Collaborators')}
                      variant="outline-brand"
                      onClick={openAssignUsersModal}
                    />
                    <TourPopover
                      align="top"
                      heading={i18n.t('Epic Collaborators')}
                      body={
                        <Trans i18nKey="tourEpicCollaborators">
                          Add Collaborators to help develop and test the Tasks
                          in this Epic. Anyone with a GitHub account can be
                          added as an Epic Collaborator. If you assign someone
                          as a Task Developer or Tester that isn’t a
                          Collaborator, they will automatically be added to this
                          list.
                        </Trans>
                      }
                    />
                  </div>
                  <AssignEpicCollaboratorsModal
                    allUsers={project.github_users}
                    selectedUsers={epicCollaborators}
                    heading={i18n.t(
                      'Add or Remove Collaborators for {{epic_name}}',
                      { epic_name: epic.name },
                    )}
                    isOpen={assignUsersModalOpen}
                    onRequestClose={closeAssignUsersModal}
                    setUsers={setEpicUsers}
                    isRefreshing={Boolean(
                      project.currently_refreshing_gh_users,
                    )}
                    projectId={project.id}
                  />
                </>
              )}
              <ConfirmRemoveUserModal
                confirmRemoveUsers={confirmRemoveUsers}
                waitingToUpdateUsers={waitingToUpdateUsers}
                handleClose={closeConfirmRemoveUsersModal}
                handleUpdateUsers={updateEpicUsers}
              />
              {epicCollaborators.length ? (
                <UserCards
                  users={epicCollaborators}
                  userId={currentUser.github_id}
                  canRemoveUser={project.has_push_permission}
                  removeUser={removeEpicUser}
                />
              ) : null}
            </div>
            <div
              className="slds-m-bottom_x-large
                metecho-secondary-block
                slds-is-relative
                heading"
            >
              <EpicStatusSteps
                epic={epic}
                tasks={tasks || []}
                readyToSubmit={readyToSubmit}
                currentlySubmitting={currentlySubmitting}
                canSubmit={project.has_push_permission}
                handleAction={handleStepAction}
              />
              <TourPopover
                align="top"
                heading={i18n.t('Wondering what to do next?')}
                body={
                  <Trans i18nKey="tourEpicNextSteps">
                    The Next Steps section is designed as a quick reference to
                    guide you through the process from adding your first Task to
                    getting your Epic merged into the Project on GitHub. The
                    next step is indicated with a blue ring, and completed steps
                    are checked.
                  </Trans>
                }
              />
            </div>
          </>
        }
      >
        <div className="slds-is-relative">
          <EpicStatusPath status={epic.status} prIsOpen={epic.pr_is_open} />
          <TourPopover
            align="bottom left"
            heading={i18n.t('Epic progress path')}
            body={
              <Trans i18nKey="tourEpicProgress">
                An Epic starts its journey as <b>Planned</b>. The Epic is{' '}
                <b>In Progress</b> when a Developer creates a Dev Org for any
                Task in the Epic. When all the Epic’s Tasks are complete, and
                the Epic is ready to be submitted for review on GitHub, the Epic
                moves to <b>Review</b>. The Epic is ready to be <b>Merged</b>{' '}
                once it is submitted for review, and is <b>Complete</b> when the
                Epic has been added to the Project on GitHub.
              </Trans>
            }
          />
        </div>
        {submitButton}
        <div className="slds-m-bottom_large">
          <div className="slds-is-relative heading">
            <TourPopover
              align="top left"
              heading={i18n.t('View & play with an Epic')}
              body={
                <Trans i18nKey="tourEpicScratchOrg">
                  Your Scratch Org is a temporary place for you to view the work
                  on this Epic. You can also use a Scratch Org to play with
                  changes to the Epic without affecting the Epic.
                </Trans>
              }
            />
            <h2 className="slds-text-heading_medium slds-p-bottom_medium">
              {i18n.t('My Epic Scratch Org')}
            </h2>
          </div>
          {orgs ? (
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
                      epic={epic}
                      repoUrl={project.repo_url}
                      openContributeModal={
                        epicIsMerged ? undefined : openContributeModal
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
        {tasks ? (
          <>
            <h2 className="slds-text-heading_medium slds-p-bottom_medium">
              {taskHeader}
            </h2>
            {project.has_push_permission && !epicIsMerged ? (
              <div className="slds-is-relative">
                <Button
                  label={i18n.t('Add a Task')}
                  variant="brand"
                  onClick={openCreateModal}
                  className="slds-m-bottom_large"
                />
                <TourPopover
                  align="top left"
                  heading={i18n.t('Add a Task to contribute')}
                  body={
                    <Trans i18nKey="tourAddTask">
                      To get started contributing to this Epic, add a Task. You
                      will be asked for a name and optional description. You can
                      chose an org type, but “dev” is recommended. Tasks
                      represent small changes to this Epic; each one has a
                      Developer and a Tester.
                    </Trans>
                  }
                />
              </div>
            ) : null}
            {epicHasTasks && (
              <>
                <EpicProgress range={epicProgress} />
                <TaskTable
                  projectId={project.id}
                  projectSlug={project.slug}
                  epicSlug={epic.slug}
                  tasks={tasks}
                  epicUsers={epicCollaborators}
                  githubUsers={project.github_users}
                  canAssign={project.has_push_permission}
                  isRefreshingUsers={Boolean(
                    project.currently_refreshing_gh_users,
                  )}
                  assignUserAction={assignUser}
                />
              </>
            )}
          </>
        ) : (
          // Fetching tasks from API
          <SpinnerWrapper />
        )}
        {project.has_push_permission && (
          <>
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
                project={project}
                epic={epic}
                isOpenOrOrgId={createModalOrgIdOrOpen}
                playgroundOrg={playgroundOrg}
                closeCreateModal={closeCreateModal}
              />
            )}
          </>
        )}
        {playgroundOrg && !epicIsMerged ? (
          <ContributeWorkModal
            epic={epic}
            isOpen={contributeModalOpen}
            hasPermissions={project.has_push_permission}
            orgId={playgroundOrg.id}
            closeModal={closeContributeModal}
            doContribute={createAndContribute}
          />
        ) : null}
        <CreateOrgModal
          project={project}
          epic={epic}
          isOpen={createOrgModalOpen}
          closeModal={closeCreateOrgModal}
        />
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default EpicDetail;
