import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React, { useCallback, useEffect } from 'react';
import DocumentTitle from 'react-document-title';
import { useDispatch, useSelector } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router-dom';

import ProductNotFound from '@/components/products/product404';
import TaskForm from '@/components/tasks/createForm';
import TaskTable from '@/components/tasks/table';
import DevHubConnect from '@/components/user/connect';
import { AppState } from '@/store';
import { fetchObject, fetchObjects } from '@/store/actions';
import { selectProduct } from '@/store/products/selectors';
import { selectProject, selectProjectSlug } from '@/store/projects/selectors';
import { selectTasksByProject } from '@/store/tasks/selectors';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

const ProjectDetail = (props: RouteComponentProps) => {
  const dispatch = useDispatch();
  const selectProductWithProps = useCallback(selectProduct, []);
  const selectProjectWithProps = useCallback(selectProject, []);
  const selectProjectSlugWithProps = useCallback(selectProjectSlug, []);
  const product = useSelector((state: AppState) =>
    selectProductWithProps(state, props),
  );
  const projectSlug = useSelector((state: AppState) =>
    selectProjectSlugWithProps(state, props),
  );
  const project = useSelector((state: AppState) =>
    selectProjectWithProps(state, props),
  );
  const tasks = useSelector(selectTasksByProject);

  useEffect(() => {
    if (product && !project) {
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.PROJECT,
          filters: { product: product.id, slug: projectSlug },
        }),
      );
    }
  }, [dispatch, product, project, projectSlug]);

  useEffect(() => {
    if (project && !tasks.length) {
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.TASK,
          filters: { project: project.id },
        }),
      );
    }
  }, [dispatch, project, tasks.length]);

  if (!project && !tasks.length) {
    if (!projectSlug || project === null) {
      return <ProductNotFound />;
    }
    // Fetching project from API
    return <Spinner />;
  }
  return (
    <DocumentTitle title={`${project.name} | ${i18n.t('MetaShare')}`}>
      <>
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={project.name}
          info={project.branch_url}
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
          <div
            className="
            slds-grid
            slds-gutters
            slds-wrap"
          >
            <div
              className="slds-col
              slds-size_1-of-1
              slds-medium-size_2-of-3
              slds-p-bottom_x-large
              slds-p-top_x-large"
            >
              <h2 className="slds-text-heading_medium slds-p-bottom_x-large">
                {i18n.t('Tasks for')} {project.name}
              </h2>
              <TaskForm
                product={product.id}
                project={project}
                startOpen={false}
              />
              {tasks && tasks[project.id] && (
                <TaskTable tasks={tasks && tasks[project.id]} />
              )}
            </div>
            <div
              className="slds-col
              slds-size_1-of-1
              slds-medium-size_1-of-3
              slds-text-longform"
            >
              <DevHubConnect />
              <h2 className="slds-text-heading_medium">{project.name}</h2>
              <p
                className="markdown"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            </div>
          </div>
        </div>
      </>
    </DocumentTitle>
  );
};

export default ProjectDetail;
