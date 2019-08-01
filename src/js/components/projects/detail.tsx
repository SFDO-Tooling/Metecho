import React, { useEffect } from 'react';
import TaskForm from '@/components/tasks/createForm';
import DocumentTitle from 'react-document-title';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import routes from '@/utils/routes';
import i18n from 'i18next';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { selectProject, selectProjectSlug } from '@/store/projects/selectors';
import { AppState } from '@/store';
import { fetchObject, fetchObjects, ObjectsActionType } from '@/store/actions';
import { selectProduct } from '@/store/products/selectors';
import { Product } from 'src/js/store/products/reducer';
import { Project } from 'src/js/store/projects/reducer';
import { OBJECT_TYPES } from '@/utils/constants';
import ProductNotFound from '@/components/products/product404';
import Spinner from '@salesforce/design-system-react/components/spinner';
import { TaskState } from '@/store/tasks/reducer';
import { selectTasksByProject } from '@/store/tasks/selectors';
import TaskTable from '../tasks/table';

export interface Props {
  project: Project;
  product: Product;
  projectSlug: string;
  doFetchObject: ObjectsActionType;
  doFetchObjects: ObjectsActionType;
  tasks: TaskState;
}

const ProjectDetail: React.SFC<Props> = ({
  product,
  project,
  projectSlug,
  doFetchObject,
  doFetchObjects,
  tasks,
}: Props) => {
  useEffect(() => {
    if (product && !project) {
      doFetchObject({
        objectType: OBJECT_TYPES.PROJECT,
        filters: { product: product.id, slug: projectSlug },
      });
    }
  }, [project, product, doFetchObject, projectSlug]);

  useEffect(() => {
    if (project && !tasks.length) {
      doFetchObjects({
        objectType: OBJECT_TYPES.TASK,
        filters: { project: project.id },
      });
    }
  }, [tasks, project]);

  if (!project) {
    if (!projectSlug || !project || project === null) {
      return <ProductNotFound />;
    }
    // Fetching product from API
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
                startOpen={true}
              />
              <TaskTable />
              {/* {tasks && tasks[project.id] && (
                <>
                  {tasks[project.id].map((task, idx) => (
                    <li key={idx}>{task.name}</li>
                  ))}
                </>
              )} */}
            </div>
            <div
              className="slds-col
              slds-size_1-of-1
              slds-medium-size_1-of-3
              slds-text-longform"
            >
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

const select = (appState: AppState, props: Props) => ({
  project: selectProject(appState, props),
  product: selectProduct(appState, props),
  projectSlug: selectProjectSlug(appState, props),
  tasks: selectTasksByProject(appState),
});
const actions = {
  doFetchObject: fetchObject,
  doFetchObjects: fetchObjects,
};
const WrappedProjectDetail = connect(
  select,
  actions,
)(ProjectDetail);
export default WrappedProjectDetail;
