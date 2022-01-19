import Button from '@salesforce/design-system-react/components/button';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import { t } from 'i18next';
import { pick } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '@/js/components/404';
import ConfirmRemoveUserModal from '@/js/components/epics/confirmRemoveUserModal';
import EpicStatusPath from '@/js/components/epics/path';
import EpicProgress from '@/js/components/epics/progress';
import EpicStatusSteps from '@/js/components/epics/steps';
import IssueCard from '@/js/components/githubIssues/issueCard';
import SelectIssueModal from '@/js/components/githubIssues/selectIssueModal';
import AssignEpicCollaboratorsModal from '@/js/components/githubUsers/assignEpicCollaborators';
import UserCards from '@/js/components/githubUsers/cards';
import PlaygroundOrgCard from '@/js/components/orgs/playgroundCard';
import { Step } from '@/js/components/steps/stepsItem';
import CreateTaskModal from '@/js/components/tasks/createForm';
import TaskTable from '@/js/components/tasks/table';
import TourPopover from '@/js/components/tour/popover';
import {
  ContributeCallback,
  ContributeWorkModal,
  CreateOrgModal,
  DeleteModal,
  DetailPageLayout,
  EditModal,
  ExternalLink,
  getEpicLoadingOrNotFound,
  getProjectLoadingOrNotFound,
  LabelWithSpinner,
  OrgData,
  PageOptions,
  SpinnerWrapper,
  SubmitModal,
  useAssignUserToTask,
  useFetchEpicIfMissing,
  useFetchEpicTasksIfMissing,
  useFetchOrgsIfMissing,
  useFetchProjectIfMissing,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { updateObject } from '@/js/store/actions';
import { Org } from '@/js/store/orgs/reducer';
import { GitHubUser, User } from '@/js/store/user/reducer';
import { selectUserState } from '@/js/store/user/selectors';
import {
  CREATE_TASK_FROM_ORG,
  EPIC_STATUSES,
  OBJECT_TYPES,
} from '@/js/utils/constants';
import { getBranchLink, getCompletedTasks } from '@/js/utils/helpers';
import routes from '@/js/utils/routes';

const EpicDetail = (
  props: RouteComponentProps<any, any, { [CREATE_TASK_FROM_ORG]?: OrgData }>,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const { project, projectSlug } = useFetchProjectIfMissing(props);
  const { epic, epicSlug, epicCollaborators } = useFetchEpicIfMissing(
    { project },
    props,
  );
  const { tasks } = useFetchEpicTasksIfMissing(
    { projectId: project?.id, epicId: epic?.id },
    props,
  );
  const { orgs } = useFetchOrgsIfMissing({ epicId: epic?.id }, props);
  const assignUser = useAssignUserToTask();
  const currentUser = useSelector(selectUserState) as User;

  const [assignUsersModalOpen, setAssignUsersModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [convertOrgData, setConvertOrgData] = useState<OrgData | null>(null);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [selectIssueModalOpen, setSelectIssueModalOpen] = useState(false);
  const {
    history,
    location: { state },
  } = props;

  const playgroundOrg = (orgs || [])[0] as Org | undefined;

  const openSelectIssueModal = useCallback(() => {
    setSelectIssueModalOpen(true);
    setAssignUsersModalOpen(false);
    setContributeModalOpen(false);
    setSubmitModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setCreateTaskModalOpen(false);
    setConvertOrgData(null);
    setCreateOrgModalOpen(false);
  }, []);

  const closeSelectIssueModal = useCallback(() => {
    setSelectIssueModalOpen(false);
  }, []);

  // "Assign users to epic" modal related:
  const openAssignUsersModal = useCallback(() => {
    setAssignUsersModalOpen(true);
    setContributeModalOpen(false);
    setSubmitModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setCreateTaskModalOpen(false);
    setConvertOrgData(null);
    setCreateOrgModalOpen(false);
    setSelectIssueModalOpen(false);
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
        setCreateTaskModalOpen(false);
        setConvertOrgData(null);
        setCreateOrgModalOpen(false);
        setSelectIssueModalOpen(false);
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
        setCreateTaskModalOpen(false);
        setConvertOrgData(null);
        setCreateOrgModalOpen(false);
        setSelectIssueModalOpen(false);
      } else {
        updateEpicUsers(users);
      }
    },
    [epic, epicCollaborators, updateEpicUsers, getRemovedUsers],
  );

  // "Submit" modal related:
  const openSubmitModal = () => {
    setSubmitModalOpen(true);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setAssignUsersModalOpen(false);
    setCreateTaskModalOpen(false);
    setConvertOrgData(null);
    setCreateOrgModalOpen(false);
    setContributeModalOpen(false);
    setSelectIssueModalOpen(false);
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
    setCreateTaskModalOpen(false);
    setConvertOrgData(null);
    setCreateOrgModalOpen(false);
    setContributeModalOpen(false);
    setSelectIssueModalOpen(false);
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
    setCreateTaskModalOpen(false);
    setConvertOrgData(null);
    setCreateOrgModalOpen(false);
    setContributeModalOpen(false);
    setSelectIssueModalOpen(false);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  // "create task" modal related:
  const openCreateModal = () => {
    setCreateTaskModalOpen(true);
    setConvertOrgData(null);
    setDeleteModalOpen(false);
    setEditModalOpen(false);
    setSubmitModalOpen(false);
    setAssignUsersModalOpen(false);
    setCreateOrgModalOpen(false);
    setContributeModalOpen(false);
    setSelectIssueModalOpen(false);
  };
  const closeCreateModal = () => {
    setCreateTaskModalOpen(false);
    setConvertOrgData(null);
  };

  // "create scratch org" modal related:
  const openCreateOrgModal = () => {
    setCreateOrgModalOpen(true);
    setCreateTaskModalOpen(false);
    setConvertOrgData(null);
    setDeleteModalOpen(false);
    setEditModalOpen(false);
    setSubmitModalOpen(false);
    setAssignUsersModalOpen(false);
    setContributeModalOpen(false);
    setSelectIssueModalOpen(false);
  };
  const closeCreateOrgModal = () => {
    setCreateOrgModalOpen(false);
  };

  // "contribute work" modal related:
  const openContributeModal = () => {
    setContributeModalOpen(true);
    setCreateTaskModalOpen(false);
    setConvertOrgData(null);
    setDeleteModalOpen(false);
    setEditModalOpen(false);
    setSubmitModalOpen(false);
    setAssignUsersModalOpen(false);
    setCreateOrgModalOpen(false);
    setSelectIssueModalOpen(false);
  };
  const closeContributeModal = useCallback(() => {
    setContributeModalOpen(false);
  }, []);
  const createAndContribute: ContributeCallback = useCallback((orgData) => {
    setConvertOrgData(orgData);
    setCreateTaskModalOpen(true);
    setDeleteModalOpen(false);
    setEditModalOpen(false);
    setSubmitModalOpen(false);
    setAssignUsersModalOpen(false);
    setCreateOrgModalOpen(false);
    setSelectIssueModalOpen(false);
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

  const epicIsMerged = epic?.status === EPIC_STATUSES.MERGED;
  const epicHasTasks = Boolean(tasks && tasks.length > 0);

  // Auto-open the create-task modal if `CREATE_TASK_FROM_ORG` param is truthy
  const creatingTaskFromOrg = state?.[CREATE_TASK_FROM_ORG];
  useEffect(() => {
    if (
      creatingTaskFromOrg?.id &&
      project?.has_push_permission &&
      !epicIsMerged
    ) {
      // Remove location state
      history.replace({ state: {} });
      createAndContribute(creatingTaskFromOrg, {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    createAndContribute,
    creatingTaskFromOrg,
    epicIsMerged,
    project?.has_push_permission,
  ]);

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
        label={t('Submitting Epic for Review on GitHub…')}
        variant="inverse"
      />
    ) : (
      t('Submit Epic for Review on GitHub')
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
          id="tour-epic-submit-review"
          align="right"
          heading={t('Submit this Epic for review')}
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
            id="tour-epic-edit"
            align="left"
            heading={t('Edit or delete this Epic')}
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

  let taskHeader = t('Tasks for {{epic_name}}', { epic_name: epic.name });
  if (!epicHasTasks && !epicIsMerged) {
    taskHeader = project.has_push_permission
      ? t('Create a Task for {{epic_name}}', {
          epic_name: epic.name,
        })
      : t('No Tasks for {{epic_name}}', { epic_name: epic.name });
  }

  return (
    <DocumentTitle title={`${epic.name} | ${project.name} | ${t('Metecho')}`}>
      <DetailPageLayout
        type={OBJECT_TYPES.EPIC}
        title={epic.name}
        titlePopover={
          <TourPopover
            id="tour-epic-name"
            align="bottom left"
            heading={t('Epic name & GitHub link')}
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
                {t('GitHub Issue')}
              </h2>
              {epic.issue ? (
                <IssueCard issueId={epic.issue} epicId={epic.id} />
              ) : (
                <Button
                  label={t('Attach Issue to Epic')}
                  variant="outline-brand"
                  onClick={openSelectIssueModal}
                />
              )}
            </div>
            <div className="slds-m-bottom_x-large metecho-secondary-block">
              <h2 className="slds-text-heading_medium slds-p-bottom_small">
                {project.has_push_permission || epicCollaborators.length
                  ? t('Collaborators')
                  : t('No Collaborators')}
              </h2>
              {project.has_push_permission && (
                <>
                  <div className="slds-is-relative">
                    <Button
                      label={t('Add or Remove Collaborators')}
                      variant="outline-brand"
                      onClick={openAssignUsersModal}
                    />
                    <TourPopover
                      id="tour-epic-collaborators"
                      align="top"
                      heading={t('Epic Collaborators')}
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
                    heading={t(
                      'Add or Remove Collaborators for {{epic_name}}',
                      { epic_name: epic.name },
                    )}
                    isOpen={assignUsersModalOpen}
                    onRequestClose={closeAssignUsersModal}
                    setUsers={setEpicUsers}
                    isRefreshing={project.currently_fetching_github_users}
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
                id="tour-epic-next-steps"
                align="top"
                heading={t('Wondering what to do next?')}
                body={
                  <Trans i18nKey="tourEpicNextSteps">
                    The Next Steps section is designed as a quick reference to
                    guide you through the process from creating your first Task
                    to getting your Epic merged into the Project on GitHub. The
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
            id="tour-epic-progress"
            align="bottom left"
            heading={t('Epic progress path')}
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
              id="tour-epic-scratch-org"
              align="top left"
              heading={t('View & play with an Epic')}
              body={
                <Trans i18nKey="tourEpicScratchOrg">
                  Your Scratch Org is a temporary place for you to view the work
                  on this Epic. You can also use a Scratch Org to play with
                  changes to the Epic without affecting the Epic.
                </Trans>
              }
            />
            <h2 className="slds-text-heading_medium slds-p-bottom_medium">
              {t('My Epic Scratch Org')}
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
                  label={t('Create Scratch Org')}
                  variant="outline-brand"
                  onClick={openCreateOrgModal}
                  disabled={epic.currently_creating_branch}
                />
              )}
            </>
          ) : (
            // Fetching scratch orgs from API
            <Button
              label={<LabelWithSpinner label={t('Loading Scratch Orgs…')} />}
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
                  label={t('Create a Task')}
                  variant="brand"
                  onClick={openCreateModal}
                  className="slds-m-bottom_large"
                />
                <TourPopover
                  id="tour-epic-add-task"
                  align="top left"
                  heading={t('Create a Task to contribute')}
                  body={
                    <Trans i18nKey="tourCreateTask">
                      To get started contributing to this Epic, create a Task.
                      You will be asked for a name and optional description. You
                      can choose an Org type, but “dev” is recommended. Tasks
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
                  tasks={tasks}
                  isFetched
                  epicUsers={epicCollaborators}
                  githubUsers={project.github_users}
                  canAssign={project.has_push_permission}
                  isRefreshingUsers={project.currently_fetching_github_users}
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
                isOpen={createTaskModalOpen}
                playgroundOrgData={convertOrgData}
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
            orgData={pick(playgroundOrg, ['id', 'org_config_name'])}
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
        <SelectIssueModal
          projectId={project.id}
          projectSlug={project.slug}
          issueCount={project.github_issue_count}
          isOpen={selectIssueModalOpen}
          closeIssueModal={closeSelectIssueModal}
          attachingToEpic={epic}
          currentlyResyncing={project.currently_fetching_issues}
        />
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default EpicDetail;
