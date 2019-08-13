import Button from '@salesforce/design-system-react/components/button';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import i18n from 'i18next';
import React, { useCallback } from 'react';
import DocumentTitle from 'react-document-title';
import { useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import FourOhFour from '@/components/404';
import {
  DetailPageLayout,
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

  const onRenderHeaderActions = () => (
    <PageHeaderControl>
      <Button
        iconCategory="utility"
        iconName="delete"
        iconPosition="left"
        label={i18n.t('Delete Task')}
        variant="text-destructive"
        disabled
      />
      {task.branch_url ? (
        <RepoLink url={task.branch_url}>
          <Button
            iconCategory="utility"
            iconName="new_window"
            iconPosition="left"
            label={i18n.t('View Branch')}
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
      <DetailPageLayout
        title={task.name}
        description={task.description}
        repoUrl={product.repo_url}
        breadcrumb={[
          { name: product.name, url: routes.product_detail(product.slug) },
          {
            name: project.name,
            url: routes.project_detail(product.slug, project.slug),
          },
          { name: task.name },
        ]}
        onRenderHeaderActions={onRenderHeaderActions}
      />
    </DocumentTitle>
  );
};

export default TaskDetail;
