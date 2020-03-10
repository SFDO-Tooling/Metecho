import Button from '@salesforce/design-system-react/components/button';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import ProgressBar from '@salesforce/design-system-react/components/progress-bar';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { useDispatch } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '@/components/404';
import ProjectStatusPath from '@/components/projects/path';
import TaskForm from '@/components/tasks/createForm';
import TaskTable from '@/components/tasks/table';
import { AssignUsersModal, UserCards } from '@/components/user/githubUser';
import {
  DetailPageLayout,
  ExternalLink,
  getProjectLoadingOrNotFound,
  getRepositoryLoadingOrNotFound,
  LabelWithSpinner,
  SpinnerWrapper,
  useFetchProjectIfMissing,
  useFetchRepositoryIfMissing,
  useFetchTasksIfMissing,
} from '@/components/utils';
import SubmitModal from '@/components/utils/submitModal';
import { ThunkDispatch } from '@/store';
import { updateObject } from '@/store/actions';
import { refreshGitHubUsers } from '@/store/repositories/actions';
import { Task } from '@/store/tasks/reducer';
import { GitHubUser } from '@/store/user/reducer';
import { OBJECT_TYPES, ORG_TYPES, OrgTypes } from '@/utils/constants';
import {
  getBranchLink,
  getCompletedTasks,
  getPercentage,
} from '@/utils/helpers';
import routes from '@/utils/routes';

const ProjectDetail = (props: RouteComponentProps) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const { repository, repositorySlug } = useFetchRepositoryIfMissing(props);
  const { project, projectSlug } = useFetchProjectIfMissing(repository, props);
  const { tasks } = useFetchTasksIfMissing(project, props);

  // "Assign users to project" modal related:
  const [assignUsersModalOpen, setAssignUsersModalOpen] = useState(false);
  const openAssignUsersModal = useCallback(() => {
    setAssignUsersModalOpen(true);
  }, []);
  const closeAssignUsersModal = useCallback(() => {
    setAssignUsersModalOpen(false);
  }, []);
  const setProjectUsers = useCallback(
    (users: GitHubUser[]) => {
      /* istanbul ignore if */
      if (!project) {
        return;
      }
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.PROJECT,
          data: {
            ...project,
            // eslint-disable-next-line @typescript-eslint/camelcase
            github_users: users,
          },
        }),
      );
      setAssignUsersModalOpen(false);
    },
    [project, dispatch],
  );
  const removeProjectUser = useCallback(
    (user: GitHubUser) => {
      /* istanbul ignore if */
      if (!project) {
        return;
      }
      const users = project.github_users.filter(
        (possibleUser) => user.id !== possibleUser.id,
      );
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.PROJECT,
          data: {
            ...project,
            // eslint-disable-next-line @typescript-eslint/camelcase
            github_users: users,
          },
        }),
      );
    },
    [project, dispatch],
  );
  const doRefreshGitHubUsers = useCallback(() => {
    /* istanbul ignore if */
    if (!repository) {
      return;
    }
    dispatch(refreshGitHubUsers(repository.id));
  }, [repository, dispatch]);

  // "Assign user to task" modal related:
  const assignUser = useCallback(
    ({
      task,
      type,
      assignee,
    }: {
      task: Task;
      type: OrgTypes;
      assignee: GitHubUser | null;
    }) => {
      /* istanbul ignore next */
      const userType = type === ORG_TYPES.DEV ? 'assigned_dev' : 'assigned_qa';
      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.TASK,
          data: {
            ...task,
            [userType]: assignee,
          },
        }),
      );
    },
    [dispatch],
  );

  // "Submit" modal related:
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const openSubmitModal = () => {
    setSubmitModalOpen(true);
  };
  const currentlySubmitting = Boolean(project?.currently_creating_pr);
  const readyToSubmit = Boolean(
    project?.has_unmerged_commits && !project?.pr_is_open,
  );
  // ProgressBar related:
  const tasksCompleted = tasks ? getCompletedTasks(tasks).length : 0;
  const tasksTotal = tasks?.length || 0;
  const projectProgress = getPercentage(tasksCompleted, tasksTotal);
  // Loading states:
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

  // This redundant check is used to satisfy TypeScript...
  /* istanbul ignore if */
  if (!repository || !project) {
    return <FourOhFour />;
  }

  if (
    (repositorySlug && repositorySlug !== repository.slug) ||
    (projectSlug && projectSlug !== project.slug)
  ) {
    // Redirect to most recent repository/project slug
    return (
      <Redirect to={routes.project_detail(repository.slug, project.slug)} />
    );
  }

  let submitButton: React.ReactNode = null;
  if (readyToSubmit) {
    const submitButtonText = currentlySubmitting ? (
      <LabelWithSpinner
        label={i18n.t('Submitting Project for Review…')}
        variant="inverse"
      />
    ) : (
      i18n.t('Submit Project for Review')
    );
    submitButton = (
      <Button
        label={submitButtonText}
        className={classNames('slds-size_full slds-m-bottom_x-large')}
        variant="brand"
        onClick={openSubmitModal}
        disabled={currentlySubmitting}
      />
    );
  }

  const { branchLink, branchLinkText } = getBranchLink(project);
  const onRenderHeaderActions = () => (
    <PageHeaderControl>
      <Button
        iconCategory="utility"
        iconName="delete"
        iconPosition="left"
        label={i18n.t('Delete Project')}
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

  return (
    <DocumentTitle
      title={`${project.name} | ${repository.name} | ${i18n.t('MetaShare')}`}
    >
      <DetailPageLayout
        title={project.name}
        description={project.description}
        repoUrl={repository.repo_url}
        breadcrumb={[
          {
            name: repository.name,
            url: routes.repository_detail(repository.slug),
          },
          { name: project.name },
        ]}
        onRenderHeaderActions={onRenderHeaderActions}
        sidebar={
          <>
            <div className="slds-m-bottom_medium">
              <h2 className="slds-text-heading_medium slds-p-bottom_small">
                {i18n.t('Collaborators')}
              </h2>
              <Button
                label={i18n.t('Add or Remove Collaborators')}
                variant="outline-brand"
                onClick={openAssignUsersModal}
              />
            </div>
            <AssignUsersModal
              allUsers={repository.github_users}
              selectedUsers={project.github_users}
              heading={`${i18n.t('Add or Remove Collaborators for')} ${
                project.name
              }`}
              isOpen={assignUsersModalOpen}
              onRequestClose={closeAssignUsersModal}
              setUsers={setProjectUsers}
              isRefreshing={Boolean(repository.currently_refreshing_gh_users)}
              refreshUsers={doRefreshGitHubUsers}
            />
            <UserCards
              users={project.github_users}
              removeUser={removeProjectUser}
            />
          </>
        }
      >
        <ProjectStatusPath project={project} tasks={tasks || []} />
        {submitButton}
        {tasks ? (
          <>
            <h2 className="slds-text-heading_medium slds-p-bottom_medium">
              {tasks.length ? (
                <>
                  {i18n.t('Tasks for')} {project.name}
                </>
              ) : (
                <>
                  {i18n.t('Add a Task for')} {project.name}
                </>
              )}
            </h2>
            <TaskForm project={project} startOpen={!tasks.length} />
            <ProgressBar
              id="progress-bar"
              value={projectProgress}
              labels={{ label: 'No Tasks Selected' }}
            />
            <TaskTable
              repositorySlug={repository.slug}
              projectSlug={project.slug}
              tasks={tasks}
              projectUsers={project.github_users}
              openAssignProjectUsersModal={openAssignUsersModal}
              assignUserAction={assignUser}
            />
          </>
        ) : (
          // Fetching tasks from API
          <SpinnerWrapper />
        )}
        {readyToSubmit && (
          <SubmitModal
            instanceId={project.id}
            instanceName={project.name}
            instanceDiffUrl={project.branch_diff_url}
            instanceType="project"
            isOpen={submitModalOpen}
            toggleModal={setSubmitModalOpen}
          />
        )}
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default ProjectDetail;
