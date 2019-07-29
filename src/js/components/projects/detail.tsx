import React from 'react';
import ProjectForm from '@/components/projects/createForm';
import DocumentTitle from 'react-document-title';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import routes from '@/utils/routes';
import i18n from 'i18next';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { selectProject, selectProjectSlug } from '@/store/projects/selectors';
import { AppState } from '@/store';
import { fetchObject } from '@/store/actions';
import { selectProduct } from '@/store/products/selectors';
import { Product } from '@/store/products/reducer';
import { Project } from '@/store/projects/reducer';

export interface Props {
  project: Project;
  product: Product;
  projectSlug: string;
}

const ProjectDetail: React.SFC<Props> = ({ product, project }: Props) => {
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
              slds-m-top_x-large"
            >
              {/* @@@ make projectForm reusable? */}
              <ProjectForm type="task" item={project} startOpen={true} />
            </div>
            <div
              className="slds-col
              slds-size_1-of-1
              slds-medium-size_1-of-3
              slds-text-longform"
            >
              <h2 className="slds-text-heading_medium detail-title">
                {project.name}
              </h2>
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
});
const actions = {
  doFetchObject: fetchObject,
};
const WrappedProjectDetail = connect(
  select,
  actions,
)(ProjectDetail);
export default WrappedProjectDetail;
