import Button from '@salesforce/design-system-react/components/button';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React from 'react';
import DocumentTitle from 'react-document-title';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '@/components/404';
import TaskForm from '@/components/tasks/createForm';
import TaskTable from '@/components/tasks/table';
import {
  DetailPageLayout,
  getProductLoadingOrNotFound,
  getProjectLoadingOrNotFound,
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
  /* istanbul ignore if */
  if (!product || !project) {
    return <FourOhFour />;
  }

  if (
    (productSlug && productSlug !== product.slug) ||
    (projectSlug && projectSlug !== project.slug)
  ) {
    // Redirect to most recent product/project slug
    return <Redirect to={routes.project_detail(product.slug, project.slug)} />;
  }

  return (
    <DocumentTitle
      title={`${project.name} | ${product.name} | ${i18n.t('MetaShare')}`}
    >
      <DetailPageLayout
        title={project.name}
        description={project.description}
        repoUrl={product.repo_url}
        breadcrumb={[
          { name: product.name, url: routes.product_detail(product.slug) },
          { name: project.name },
        ]}
      >
        <Button
          label={i18n.t('Submit Project')}
          className="slds-size_full slds-m-bottom_x-large"
          variant="outline-brand"
          disabled
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
              productSlug={product.slug}
              projectSlug={project.slug}
              tasks={tasks}
            />
          </>
        ) : (
          // Fetching tasks from API
          <Spinner />
        )}
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default ProjectDetail;
