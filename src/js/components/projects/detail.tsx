import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import Button from '@salesforce/design-system-react/components/button';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React from 'react';
import DocumentTitle from 'react-document-title';
import { Link, Redirect, RouteComponentProps } from 'react-router-dom';

import RepositoryNotFound from '@/components/repositories/repository404';
import TaskForm from '@/components/tasks/createForm';
import TaskTable from '@/components/tasks/table';
import {
  getRepositoryLoadingOrNotFound,
  getProjectLoadingOrNotFound,
  RepoLink,
  useFetchRepositoryIfMissing,
  useFetchProjectIfMissing,
  useFetchTasksIfMissing,
} from '@/components/utils';
import routes from '@/utils/routes';

const ProjectDetail = (props: RouteComponentProps) => {
  const { repository, repositorySlug } = useFetchRepositoryIfMissing(props);
  const { project, projectSlug } = useFetchProjectIfMissing(repository, props);
  const { tasks } = useFetchTasksIfMissing(project, props);

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
    return <RepositoryNotFound />;
  }

  if (
    (repositorySlug && repositorySlug !== repository.slug) ||
    (projectSlug && projectSlug !== project.slug)
  ) {
    // Redirect to most recent repository slug
    return (
      <Redirect to={routes.project_detail(repository.slug, project.slug)} />
    );
  }

  const projectDescriptionHasTitle =
    project.description &&
    (project.description.startsWith('<h1>') ||
      project.description.startsWith('<h2>'));

  return (
    <DocumentTitle
      title={`${project.name} | ${repository.name} | ${i18n.t('MetaShare')}`}
    >
      <>
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={project.name}
          info={<RepoLink url={repository.repo_url} shortenGithub />}
        />
        <div
          className="slds-p-horizontal_x-large
            slds-p-top_x-small
            ms-breadcrumb"
        >
          <BreadCrumb
            trail={[
              <Link to={routes.home()} key="home">
                {i18n.t('Home')}
              </Link>,
              <Link to={routes.repository_detail(repository.slug)} key="home">
                {repository.name}
              </Link>,
              <div className="slds-p-horizontal_x-small" key={project.slug}>
                {project.name}
              </div>,
            ]}
          />
        </div>
        <div
          className="slds-p-around_x-large
            slds-grid
            slds-gutters
            slds-wrap"
        >
          <div
            className="slds-col
              slds-size_1-of-1
              slds-medium-size_2-of-3
              slds-p-bottom_x-large"
          >
            <Button
              label={i18n.t('Submit Project')}
              className="slds-size_full slds-m-bottom_x-large"
              variant="outline-brand"
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
              <Spinner />
            )}
          </div>
          <div
            className="slds-col
              slds-size_1-of-1
              slds-medium-size_1-of-3
              slds-text-longform"
          >
            {!projectDescriptionHasTitle && (
              <h2 className="slds-text-heading_medium">{project.name}</h2>
            )}
            {/* This description is pre-cleaned by the API */}
            {project.description && (
              <p
                className="markdown"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            )}
          </div>
        </div>
      </>
    </DocumentTitle>
  );
};

export default ProjectDetail;
