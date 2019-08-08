import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import Button from '@salesforce/design-system-react/components/button';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React from 'react';
import DocumentTitle from 'react-document-title';
import { Link, Redirect, RouteComponentProps } from 'react-router-dom';

import ProductNotFound from '@/components/products/product404';
import TaskForm from '@/components/tasks/createForm';
import TaskTable from '@/components/tasks/table';
import {
  getProductLoadingOrNotFound,
  getProjectLoadingOrNotFound,
  RepoLink,
  useFetchProductIfMissing,
  useFetchProjectIfMissing,
  useFetchTasksIfMissing,
} from '@/components/utils';
import routes from '@/utils/routes';

const ProjectDetail = (props: RouteComponentProps) => {
  const { product, productSlug } = useFetchProductIfMissing(props);
  const { project, projectSlug } = useFetchProjectIfMissing(product, props);
  const { tasks } = useFetchTasksIfMissing(project, props);

  const productLoadingOrNotFound = getProductLoadingOrNotFound({
    product,
    productSlug,
  });
  if (productLoadingOrNotFound !== false) {
    return productLoadingOrNotFound;
  }

  const projectLoadingOrNotFound = getProjectLoadingOrNotFound({
    product,
    project,
    projectSlug,
  });
  if (projectLoadingOrNotFound !== false) {
    return projectLoadingOrNotFound;
  }

  // This redundant check is used to satisfy TypeScript...
  if (!product || !project) {
    return <ProductNotFound />;
  }

  if (
    (productSlug && productSlug !== product.slug) ||
    (projectSlug && projectSlug !== project.slug)
  ) {
    // Redirect to most recent product slug
    return <Redirect to={routes.project_detail(product.slug, project.slug)} />;
  }

  const projectDescriptionHasTitle =
    project.description &&
    (project.description.startsWith('<h1>') ||
      project.description.startsWith('<h2>'));

  return (
    <DocumentTitle
      title={`${project.name} | ${product.name} | ${i18n.t('MetaShare')}`}
    >
      <>
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={project.name}
          info={
            <RepoLink url={project.branch_url}>{project.branch_url}</RepoLink>
          }
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
              <Link to={routes.product_detail(product.slug)} key="home">
                {product.name}
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
                  {i18n.t('Tasks for')} {project.name}
                </h2>
                <TaskForm project={project} startOpen={!tasks.length} />
                {Boolean(tasks.length) && (
                  <TaskTable
                    productSlug={product.slug}
                    projectSlug={project.slug}
                    tasks={tasks}
                  />
                )}
              </>
            ) : (
              // Fetching tasks from API
              <Spinner />
            )}
          </div>
          <div
            className="slds-col
              slds-size_1-of-1
              slds-medium-size_3-of-3
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
