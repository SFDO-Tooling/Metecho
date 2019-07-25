import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React, { ReactNode, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { connect } from 'react-redux';
import { Link, Redirect, RouteComponentProps } from 'react-router-dom';

import ProductNotFound from '@/components/products/product404';
import ProjectForm from '@/components/projects/createForm';
import ProjectListItem from '@/components/projects/listItem';
import { LabelWithSpinner } from '@/components/utils';
import { AppState } from '@/store';
import { fetchObject, fetchObjects, ObjectsActionType } from '@/store/actions';
import { Product } from '@/store/products/reducer';
import { selectProduct, selectProductSlug } from '@/store/products/selectors';
import { ProjectsByProductState } from '@/store/projects/reducer';
import { selectProjectsByProduct } from '@/store/projects/selectors';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

type Props = {
  product?: Product | null;
  productSlug?: string;
  projects: ProjectsByProductState | undefined;
  doFetchObject: ObjectsActionType;
  doFetchObjects: ObjectsActionType;
  y: number;
  next: string | null;
} & RouteComponentProps;

const RepoLink = ({ url, children }: { url: string; children: ReactNode }) => (
  <a href={url} target="_blank" rel="noreferrer noopener">
    {children}
  </a>
);

const ProductDetail = ({
  product,
  productSlug,
  projects,
  doFetchObject,
  doFetchObjects,
}: Props) => {
  const [fetchingProjects, setFetchingProjects] = useState(false);

  useEffect(() => {
    if (productSlug && product === undefined) {
      // Fetch product from API
      doFetchObject({
        objectType: OBJECT_TYPES.PRODUCT,
        filters: { slug: productSlug },
      });
    }
  }, [product, productSlug, doFetchObject]);

  useEffect(() => {
    if (product && (!projects || !projects.fetched)) {
      // Fetch projects from API
      doFetchObjects({
        objectType: OBJECT_TYPES.PROJECT,
        filters: { product: product.id },
        reset: true,
      });
    }
  }, [product, projects, doFetchObjects]);

  if (!product) {
    if (!productSlug || product === null || fetchingProjects) {
      return <ProductNotFound />;
    }
    // Fetching product from API
    return <Spinner />;
  }

  if (productSlug && productSlug !== product.slug) {
    // Redirect to most recent product slug
    return <Redirect to={routes.product_detail(product.slug)} />;
  }

  const maybeFetchObjects = () => {
    /* istanbul ignore else */
    if (projects && projects.next) {
      /* istanbul ignore else */
      setFetchingProjects(true);

      doFetchObjects({
        objectType: OBJECT_TYPES.PROJECT,
        filters: { product: product.id },
        url: projects.next,
      }).finally(() => setFetchingProjects(false));
    }
  };
  const productDescriptionHasTitle =
    product.description &&
    (product.description.startsWith('<h1>') ||
      product.description.startsWith('<h2>'));

  return (
    <DocumentTitle title={`${product.name} | ${i18n.t('MetaShare')}`}>
      <>
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={product.name}
          info={<RepoLink url={product.repo_url}>{product.repo_url}</RepoLink>}
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
              <div className="slds-p-horizontal_x-small" key={product.slug}>
                {product.name}
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
            {!projects || !projects.fetched ? (
              // Fetching projects from API
              <Spinner />
            ) : (
              <>
                <ProjectForm
                  product={product}
                  startOpen={!projects.projects.length}
                />
                {Boolean(projects.projects.length) && (
                  <>
                    <h2 className="slds-text-heading_medium">
                      {i18n.t('Projects for')} {product.name}
                    </h2>
                    <ul className="slds-has-dividers_bottom">
                      {projects.projects.map(project => (
                        <ProjectListItem
                          key={project.id}
                          project={project}
                          product={product}
                        />
                      ))}
                    </ul>
                    {projects && projects.next ? (
                      <div className="slds-m-top_large">
                        <Button
                          className="slds-size_full"
                          label={
                            fetchingProjects ? (
                              <LabelWithSpinner
                                label={i18n.t('Loading…')}
                                variant="base"
                                size="x-small"
                              />
                            ) : (
                              'Load More'
                            )
                          }
                          onClick={maybeFetchObjects}
                          variant="brand"
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </>
            )}
          </div>
          <div
            className="slds-col
                slds-size_1-of-1
                slds-medium-size_1-of-3
                slds-text-longform"
          >
            {!productDescriptionHasTitle && (
              <h2 className="slds-text-heading_medium">{product.name}</h2>
            )}
            {/* This description is pre-cleaned by the API */}
            {product.description && (
              <p
                className="markdown"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
            <RepoLink url={product.repo_url}>
              {i18n.t('GitHub Repo')}
              <Icon
                category="utility"
                name="new_window"
                size="xx-small"
                className="slds-m-bottom_xx-small"
                containerClassName="slds-m-left_xx-small slds-current-color"
              />
            </RepoLink>
          </div>
        </div>
      </>
    </DocumentTitle>
  );
};

const select = (appState: AppState, props: Props) => ({
  productSlug: selectProductSlug(appState, props),
  product: selectProduct(appState, props),
  projects: selectProjectsByProduct(appState, props),
});
const actions = {
  doFetchObject: fetchObject,
  doFetchObjects: fetchObjects,
};
const WrappedProductDetail = connect(
  select,
  actions,
)(ProductDetail);

export default WrappedProductDetail;
