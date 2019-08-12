import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import Button from '@salesforce/design-system-react/components/button';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import i18n from 'i18next';
import React, { useCallback } from 'react';
import DocumentTitle from 'react-document-title';
import { useSelector } from 'react-redux';
import { Link, Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '@/components/404';
import {
  getProductLoadingOrNotFound,
  getProjectLoadingOrNotFound,
  getTaskLoadingOrNotFound,
  RepoLink,
  useFetchProductIfMissing,
  useFetchProjectIfMissing,
  useFetchTasksIfMissing,
} from '@/components/utils';
import { AppState } from '@/store';
import { selectTask, selectTaskSlug } from '@/store/tasks/selectors';
import routes from '@/utils/routes';

const TaskDetail = (props: RouteComponentProps) => {
  const { product, productSlug } = useFetchProductIfMissing(props);
  const { project, projectSlug } = useFetchProjectIfMissing(product, props);
  useFetchTasksIfMissing(project, props);
  const selectTaskWithProps = useCallback(selectTask, []);
  const selectTaskSlugWithProps = useCallback(selectTaskSlug, []);
  const task = useSelector((state: AppState) =>
    selectTaskWithProps(state, props),
  );
  const taskSlug = useSelector((state: AppState) =>
    selectTaskSlugWithProps(state, props),
  );

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
    task,
    taskSlug,
  });

  if (taskLoadingOrNotFound !== false) {
    return taskLoadingOrNotFound;
  }

  // This redundant check is used to satisfy TypeScript...
  /* istanbul ignore if */
  if (!product || !project || !task) {
    return <FourOhFour />;
  }

  if (
    (productSlug && productSlug !== product.slug) ||
    (projectSlug && projectSlug !== project.slug) ||
    (taskSlug && taskSlug !== task.slug)
  ) {
    // Redirect to most recent product/project/task slug
    return (
      <Redirect
        to={routes.task_detail(product.slug, project.slug, task.slug)}
      />
    );
  }

  const taskDescriptionHasTitle =
    task.description &&
    (task.description.startsWith('<h1>') ||
      task.description.startsWith('<h2>'));

  const controls = () => (
    <PageHeaderControl>
      <Button
        iconCategory="utility"
        iconName="delete"
        iconPosition="left"
        label="Delete Task"
        variant="text-destructive"
        disabled
      />
      {task.branch_url ? (
        <RepoLink url={task.branch_url}>
          <Button
            iconCategory="utility"
            iconName="new_window"
            iconPosition="left"
            label="View Branch"
            variant="outline-brand"
            className="slds-m-left_large"
          />
        </RepoLink>
      ) : null}
    </PageHeaderControl>
  );

  return (
    <DocumentTitle
      title={` ${task.name} | ${project.name} | ${product.name} | ${i18n.t(
        'MetaShare',
      )}`}
    >
      <>
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={task.name}
          info={<RepoLink url={product.repo_url} shortenGithub />}
          onRenderControls={controls}
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
              slds-medium-size_2-of-3
              slds-p-bottom_x-large"
          ></div>
          <div
            className="slds-col
              slds-size_1-of-1
              slds-medium-size_1-of-3
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
  );
};

export default TaskDetail;
