import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React, { useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '@/components/404';
import TaskForm from '@/components/tasks/createForm';
import SubmitModal from '@/components/tasks/submit';
import TaskTable from '@/components/tasks/table';
import {
  DetailPageLayout,
  getProjectLoadingOrNotFound,
  getRepositoryLoadingOrNotFound,
  SpinnerWrapper,
  useFetchProjectIfMissing,
  useFetchRepositoryIfMissing,
  useFetchTasksIfMissing,
} from '@/components/utils';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

const ProjectDetail = (props: RouteComponentProps) => {
  const { repository, repositorySlug } = useFetchRepositoryIfMissing(props);
  const { project, projectSlug } = useFetchProjectIfMissing(repository, props);
  const { tasks } = useFetchTasksIfMissing(project, props);

  // Submit modal related:
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const openSubmitModal = () => {
    setSubmitModalOpen(true);
  };
  const currentlySubmitting = Boolean(project && project.currently_creating_pr);
  const readyToSubmit = Boolean(
    project && project.has_unmerged_commits && !project.pr_is_open,
  );
  console.debug('Ready to Submit', readyToSubmit);

  // Subscribe to individual task WS channels once, and unsubscribe on unmount
  const taskIds = tasks && tasks.map((t) => t.id);
  useEffect(() => {
    if (taskIds && window.socket) {
      for (const id of taskIds) {
        window.socket.subscribe({
          model: OBJECT_TYPES.TASK,
          id,
        });
      }
    }
    return () => {
      if (taskIds && window.socket) {
        for (const id of taskIds) {
          window.socket.unsubscribe({
            model: OBJECT_TYPES.TASK,
            id,
          });
        }
      }
    };
  }, [taskIds]);

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
      >
        <Button
          label={i18n.t('Submit Project')}
          className="slds-size_full slds-m-bottom_x-large"
          variant="outline-brand"
          onClick={openSubmitModal}
          disabled={currentlySubmitting}
        />
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
            <TaskTable
              repositorySlug={repository.slug}
              projectSlug={project.slug}
              tasks={tasks}
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
            instanceType={'project'}
            isOpen={submitModalOpen}
            toggleModal={setSubmitModalOpen}
          />
        )}
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default ProjectDetail;
