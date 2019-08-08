import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import i18n from 'i18next';
import React from 'react';
import DocumentTitle from 'react-document-title';
import { Link, Redirect, RouteComponentProps } from 'react-router-dom';

import ProductNotFound from '@/components/products/product404';
import {
  getProductLoadingOrNotFound,
  getProjectLoadingOrNotFound,
  getTaskLoadingOrNotFound,
  RepoLink,
  useFetchProductIfMissing,
  useFetchProjectIfMissing,
  useFetchTaskIfMissing,
} from '@/components/utils';
import routes from '@/utils/routes';

const TaskDetail = (props: RouteComponentProps) => {
  const { product, productSlug } = useFetchProductIfMissing(props);
  const { project, projectSlug } = useFetchProjectIfMissing(product, props);
  const { task, taskSlug } = useFetchTaskIfMissing(project, props);

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
  const taskLoadingOrNotFound = getTaskLoadingOrNotFound({
    product,
    project,
    projectSlug,
    task,
    taskSlug,
  });
  if (taskLoadingOrNotFound !== false) {
    return taskLoadingOrNotFound;
  }
  if (!product || !project) {
    return <ProductNotFound />;
  }
  const taskDescriptionHasTitle =
    task &&
    task.description &&
    (task.description.startsWith('<h1>') ||
      task.description.startsWith('<h2>'));
  return (
    <>
      <DocumentTitle
        title={` ${task.name} | ${project.name} | ${product.name} | ${i18n.t(
          'MetaShare',
        )}`}
      >
        <>
          <PageHeader
            className="page-header slds-p-around_x-large"
            title={task.name}
            info={
              <RepoLink url={product.repo_url}>{product.repo_url}</RepoLink>
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
                <Link to={routes.product_detail(product.slug)} key="product">
                  {product.name}
                </Link>,
                <Link
                  to={routes.project_detail(product.slug, project.slug)}
                  key="project"
                  className="slds-p-horizontal_x-small"
                >
                  {project.name}
                </Link>,
                <div className="slds-p-horizontal_x-small" key={task.slug}>
                  {task.name}
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
              slds-medium-size_7-of-12
              slds-p-bottom_x-large"
            ></div>
            <div
              className="slds-col
              slds-size_1-of-1
              slds-medium-size_5-of-12
              slds-text-longform"
            >
              {!taskDescriptionHasTitle && (
                <h2 className="slds-text-heading_medium">{task.name}</h2>
              )}
              {/* This description is pre-cleaned by the API */}
              {task.description && (
                <p
                  className="markdown"
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              )}
            </div>
          </div>
        </>
      </DocumentTitle>
    </>
  );
};

export default TaskDetail;
